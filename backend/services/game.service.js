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
            messages: []
        })

        return gameRecord[0].id
    }

    // shape of the game state that is sent to clients
    serialize(entry) {
        return {
            game: entry.game,
            whitePlayer: entry.whitePlayer,
            blackPlayer: entry.blackPlayer,
            messages: entry.messages
        }
    }

    async finishGame(gameID){
        const entry = gameStore.get(gameID)
        if (!entry) return

        const chess = entry.chess
        entry.game.status = "finished"
        entry.game.moves = chess.history()
        entry.game.fen = chess.fen()

        // draw_reason values must match the draw_reason enum in db-schema.sql
        if (chess.isCheckmate()) {
            entry.game.winner_id = chess.turn() === "w" ? entry.blackPlayer.id : entry.whitePlayer.id
        } else if (chess.isDraw()) {
            entry.game.status = "draw"

            if (chess.isStalemate()) {
                entry.game.draw_reason = "stalemate"
            } else if (chess.isInsufficientMaterial()) {
                entry.game.draw_reason = "insufficient_material"
            } else if (chess.isThreefoldRepetition()) {
                entry.game.draw_reason = "threefold_repetition"
            } else if (chess.isDrawByFiftyMoves()) {
                entry.game.draw_reason = "fifty_move_rule"
            }
        }

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

        // finished games are served from the DB from now on
        gameStore.delete(gameID)
    }

    // promotion defaults to a queen until the client has a piece picker
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

        if (entry.chess.isGameOver()) {
            await this.finishGame(gameID)
        }

        return {success: true}
    }
}

export default new gameService()
