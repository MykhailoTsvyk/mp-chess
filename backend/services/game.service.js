import {Chess} from "chess.js";
import db from "../db/db.js";
import {gameStore} from "../store/game.store.js";
import PlayerDto from "../dtos/player.dto.js";

class gameService {

    // array of user IDs to randomly assign sides
    async start(users, gameRoomID) {
        const pivot = Math.floor(Math.random() * 2)
        const whitePlayerSocket = users[pivot] // 0 OR 1
        const blackPlayerSocket = users[pivot ? 0 : 1] // opposite side to white

        const gameRecord = await db.query(`
            INSERT INTO games (
                id,
                white_player,
                black_player,
                status
            )
            VALUES ($1, $2, $3, 'active')
             RETURNING *`,
            [gameRoomID, whitePlayerSocket.user.id, blackPlayerSocket.user.id])

        users[0].join(gameRoomID)
        users[1].join(gameRoomID)

        gameStore.set(gameRoomID, {
            game: gameRecord[0],
            whitePlayer: new PlayerDto(whitePlayerSocket.user),
            blackPlayer: new PlayerDto(blackPlayerSocket.user),
            chess: new Chess(),
            messages: [],
            drawOffer: null, // {from: userID} while an offer is pending
            drawBlocked: new Set(), // players who can't offer again until their next move
            leaveTimers: new Map() // userID -> {deadline, timer} for players who left
        })

        return gameRecord[0].id
    }

    // shape of the game state that is sent to clients
    serialize(entry) {
        const leftPlayers = {}
        for (const [userID, {deadline}] of entry.leaveTimers) {
            leftPlayers[userID] = deadline
        }

        return {
            game: entry.game,
            whitePlayer: entry.whitePlayer,
            blackPlayer: entry.blackPlayer,
            messages: entry.messages,
            drawOffer: entry.drawOffer,
            drawBlocked: [...entry.drawBlocked],
            leftPlayers // userID -> timestamp when the timeout ends the game
        }
    }

    isPlayer(entry, userID) {
        return entry.whitePlayer.id === userID || entry.blackPlayer.id === userID
    }

    getOpponentID(entry, userID) {
        return entry.whitePlayer.id === userID ? entry.blackPlayer.id : entry.whitePlayer.id
    }

    // single exit point for every way a game can end
    async endGame(gameID, {status, winnerID = null, drawReason = null}) {
        const entry = gameStore.get(gameID)
        if (!entry) return

        for (const {timer} of entry.leaveTimers.values()) {
            clearTimeout(timer)
        }
        entry.leaveTimers.clear()
        entry.drawOffer = null

        entry.game.status = status
        entry.game.winner_id = winnerID
        entry.game.draw_reason = drawReason
        entry.game.moves = entry.chess.history()
        entry.game.fen = entry.chess.fen()

        // remove before the async save so no other action can end the game twice;
        // finished games are served from the DB from now on
        gameStore.delete(gameID)

        const query = `
        UPDATE games
        SET status = $1,
            winner_id = $2,
            draw_reason = $3,
            moves = $4,
            fen = $5,
            white_time_remaining = $6,
            black_time_remaining = $7
        WHERE id = $8
    `

        try {
            await db.query(query, [
                entry.game.status,
                entry.game.winner_id,
                entry.game.draw_reason,
                entry.game.moves,
                entry.game.fen,
                entry.game.white_time_remaining,
                entry.game.black_time_remaining,
                entry.game.id
            ])
            console.log(`Game ${entry.game.id} successfully saved to DB.`)
        } catch (err) {
            console.error("Failed to save finished game to DB:", err)
        }
    }

    // ends the game based on the board position (checkmate or automatic draw)
    async finishGame(gameID){
        const entry = gameStore.get(gameID)
        if (!entry) return

        const chess = entry.chess

        // draw_reason values must match the draw_reason enum in db-schema.sql
        if (chess.isCheckmate()) {
            const winnerID = chess.turn() === "w" ? entry.blackPlayer.id : entry.whitePlayer.id
            return this.endGame(gameID, {status: "finished", winnerID})
        }

        let drawReason = null
        if (chess.isStalemate()) {
            drawReason = "stalemate"
        } else if (chess.isInsufficientMaterial()) {
            drawReason = "insufficient_material"
        } else if (chess.isThreefoldRepetition()) {
            drawReason = "threefold_repetition"
        } else if (chess.isDrawByFiftyMoves()) {
            drawReason = "fifty_move_rule"
        }

        return this.endGame(gameID, {status: "draw", drawReason})
    }

    // promotion is the piece chosen in the client's picker ("q", "r", "b" or "n");
    // it is checked against chess.js's legal moves, a queen is used if it's missing
    async makeMove(userID, gameID, from, to, promotion = "q"){
        const entry = gameStore.get(gameID)

        if (!entry) {
            return {success: false}
        }

        let senderColor = null
        if (entry.whitePlayer.id === userID) senderColor = "w"
        if (entry.blackPlayer.id === userID) senderColor = "b"

        if (senderColor !== entry.chess.turn()) {
            return {success: false}
        }

        const legalMove = entry.chess.moves({square: from, verbose: true})
            .find(m => m.to === to && (!m.promotion || m.promotion === promotion))

        if (!legalMove) {
            return {success: false}
        }

        try {
            entry.chess.move({from, to, promotion: legalMove.promotion})
        } catch (e) {
            return {success: false}
        }

        entry.game.fen = entry.chess.fen()
        entry.game.moves = entry.chess.history()

        // a move cancels the mover's own draw offer and lets them offer again
        if (entry.drawOffer?.from === userID) {
            entry.drawOffer = null
        }
        entry.drawBlocked.delete(userID)

        if (entry.chess.isGameOver()) {
            await this.finishGame(gameID)
        }

        return {success: true}
    }

    async resign(userID, gameID) {
        const entry = gameStore.get(gameID)
        if (!entry || !this.isPlayer(entry, userID)) {
            return {success: false}
        }

        await this.endGame(gameID, {status: "finished", winnerID: this.getOpponentID(entry, userID)})
        return {success: true}
    }

    async offerDraw(userID, gameID) {
        const entry = gameStore.get(gameID)
        if (!entry || !this.isPlayer(entry, userID)) {
            return {success: false}
        }

        // offering while the opponent's offer is pending accepts it
        if (entry.drawOffer && entry.drawOffer.from !== userID) {
            await this.endGame(gameID, {status: "draw", drawReason: "agreement"})
            return {success: true}
        }

        if (entry.drawOffer || entry.drawBlocked.has(userID)) {
            return {success: false}
        }

        entry.drawOffer = {from: userID}
        return {success: true}
    }

    async respondDraw(userID, gameID, accept) {
        const entry = gameStore.get(gameID)
        if (!entry || !this.isPlayer(entry, userID)) {
            return {success: false}
        }

        // only the opponent of whoever offered can answer
        if (!entry.drawOffer || entry.drawOffer.from === userID) {
            return {success: false}
        }

        if (accept) {
            await this.endGame(gameID, {status: "draw", drawReason: "agreement"})
        } else {
            entry.drawBlocked.add(entry.drawOffer.from)
            entry.drawOffer = null
        }

        return {success: true}
    }

    startLeaveTimer(gameID, userID, timeoutMs, onTimeout) {
        const entry = gameStore.get(gameID)
        if (!entry || entry.leaveTimers.has(userID)) return false

        const timer = setTimeout(onTimeout, timeoutMs)
        entry.leaveTimers.set(userID, {deadline: Date.now() + timeoutMs, timer})
        return true
    }

    cancelLeaveTimer(gameID, userID) {
        const entry = gameStore.get(gameID)
        const leave = entry?.leaveTimers.get(userID)
        if (!leave) return false

        clearTimeout(leave.timer)
        entry.leaveTimers.delete(userID)
        return true
    }

    // called when a player's leave timer runs out
    async resolveAbandonment(gameID, leaverID, isOpponentPresent) {
        const entry = gameStore.get(gameID)
        if (!entry) return

        if (entry.chess.history().length === 0) {
            return this.endGame(gameID, {status: "aborted"})
        }

        if (!isOpponentPresent) {
            return this.endGame(gameID, {status: "draw"})
        }

        return this.endGame(gameID, {status: "finished", winnerID: this.getOpponentID(entry, leaverID)})
    }
}

export default new gameService()
