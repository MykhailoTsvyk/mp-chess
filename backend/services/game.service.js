import {Chess} from "chess.js";
import db from "../db/db.js";
import {gameStore} from "../store/game.store.js";
import PlayerDto from "../dtos/player.dto.js";
import {TIME_CONTROLS, FIRST_MOVE_TIMEOUT_MS, RATING_COLUMNS} from "../config/timeControls.js";
import {calculateRatings} from "./elo.service.js";

class gameService {

    // array of user IDs to randomly assign sides;
    // onTimerEnd(entry) is called when a clock or the first-move deadline ends the game
    async start(users, gameRoomID, timeControlID, onTimerEnd) {
        const pivot = Math.floor(Math.random() * 2)
        const whitePlayerSocket = users[pivot] // 0 OR 1
        const blackPlayerSocket = users[pivot ? 0 : 1] // opposite side to white
        const {initialSeconds, incrementSeconds, category} = TIME_CONTROLS[timeControlID]

        // ratings are read from the DB, because socket.user is only loaded when the socket
        // connects and would miss rating changes from earlier games
        const whiteRecord = await db.one(`SELECT * FROM users WHERE id = $1`, [whitePlayerSocket.user.id])
        const blackRecord = await db.one(`SELECT * FROM users WHERE id = $1`, [blackPlayerSocket.user.id])
        const whitePlayer = new PlayerDto(whiteRecord, category)
        const blackPlayer = new PlayerDto(blackRecord, category)

        const gameRecord = await db.query(`
            INSERT INTO games (
                id,
                white_player,
                black_player,
                status,
                initial_time_control,
                increment_time_control,
                white_time_remaining,
                black_time_remaining,
                rating_category,
                white_elo_before,
                black_elo_before
            )
            VALUES ($1, $2, $3, 'active', $4, $5, $4, $4, $6, $7, $8)
             RETURNING *`,
            [gameRoomID, whitePlayer.id, blackPlayer.id, initialSeconds, incrementSeconds,
                category, whitePlayer.elo, blackPlayer.elo])

        users[0].join(gameRoomID)
        users[1].join(gameRoomID)

        gameStore.set(gameRoomID, {
            game: gameRecord[0],
            whitePlayer,
            blackPlayer,
            chess: new Chess(),
            messages: [],
            drawOffer: null, // {from: userID} while an offer is pending
            drawBlocked: new Set(), // players who can't offer again until their next move
            leaveTimers: new Map(), // userID -> {deadline, timer} for players who left
            timeControl: timeControlID,
            onTimerEnd,
            // time is only subtracted when a move is made; the running side's time is
            // remaining - (now - turnStartedAt), and one timeout fires when it runs out
            clock: {
                remaining: {w: initialSeconds * 1000, b: initialSeconds * 1000},
                increment: incrementSeconds * 1000,
                turnStartedAt: Date.now(),
                running: true,
                flagTimer: null,
                firstMoveDeadline: null,
                firstMoveTimer: null
            }
        })

        // clocks start right away, and white also has a first-move deadline
        this.scheduleClock(gameRoomID)
        this.scheduleFirstMove(gameRoomID)

        return gameRecord[0].id
    }

    // remaining milliseconds of a side, including the time of the turn in progress
    getRemaining(entry, color) {
        const {clock} = entry
        if (!clock.running || entry.chess.turn() !== color) {
            return clock.remaining[color]
        }
        return Math.max(0, clock.remaining[color] - (Date.now() - clock.turnStartedAt))
    }

    // one timeout for the side to move, fired when their time runs out
    scheduleClock(gameID) {
        const entry = gameStore.get(gameID)
        if (!entry) return

        clearTimeout(entry.clock.flagTimer)
        const ms = this.getRemaining(entry, entry.chess.turn())
        entry.clock.flagTimer = setTimeout(() => this.handleClockTimeout(gameID), ms)
    }

    // each side gets FIRST_MOVE_TIMEOUT_MS for its first move: white from the start,
    // black from white's first move
    scheduleFirstMove(gameID) {
        const entry = gameStore.get(gameID)
        if (!entry) return

        clearTimeout(entry.clock.firstMoveTimer)
        entry.clock.firstMoveTimer = null
        entry.clock.firstMoveDeadline = null

        if (entry.chess.history().length >= 2) return

        entry.clock.firstMoveDeadline = Date.now() + FIRST_MOVE_TIMEOUT_MS
        entry.clock.firstMoveTimer = setTimeout(() => this.handleFirstMoveTimeout(gameID), FIRST_MOVE_TIMEOUT_MS)
    }

    // true while the side to move hasn't made its first move yet
    isWaitingForFirstMove(entry) {
        return entry.chess.history().length < 2
    }

    async handleClockTimeout(gameID) {
        try {
            const entry = gameStore.get(gameID)
            if (!entry) return

            const color = entry.chess.turn()

            // timers can fire a few ms early; wait for the rest
            if (this.getRemaining(entry, color) > 0) {
                this.scheduleClock(gameID)
                return
            }

            if (this.isWaitingForFirstMove(entry)) {
                await this.endGame(gameID, {status: "aborted"})
            } else {
                const winnerID = color === "w" ? entry.blackPlayer.id : entry.whitePlayer.id
                await this.endGame(gameID, {status: "finished", winnerID})
            }

            entry.onTimerEnd?.(entry)
        } catch (e) {
            console.error("Failed to resolve clock timeout:", e)
        }
    }

    async handleFirstMoveTimeout(gameID) {
        try {
            const entry = gameStore.get(gameID)
            if (!entry || !this.isWaitingForFirstMove(entry)) return

            await this.endGame(gameID, {status: "aborted"})
            entry.onTimerEnd?.(entry)
        } catch (e) {
            console.error("Failed to resolve first move timeout:", e)
        }
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
            leftPlayers, // userID -> timestamp when the timeout ends the game
            // milliseconds measured on the server at send time, so client clock differences don't matter
            clock: {
                timeControl: entry.timeControl,
                white: this.getRemaining(entry, "w"),
                black: this.getRemaining(entry, "b"),
                turn: entry.chess.turn(),
                running: entry.clock.running,
                firstMoveMs: entry.clock.firstMoveDeadline ? Math.max(0, entry.clock.firstMoveDeadline - Date.now()) : null
            }
        }
    }

    // the live game this user is playing in (not spectating), or undefined;
    // live games only exist in memory, so the DB's 'active' rows are not used here
    findActiveGameForUser(userID) {
        for (const entry of gameStore.getAll().values()) {
            if (this.isPlayer(entry, userID)) return entry
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

        // freeze both clocks at their final values; the DB stores whole seconds
        const {clock} = entry
        clock.remaining.w = this.getRemaining(entry, "w")
        clock.remaining.b = this.getRemaining(entry, "b")
        clock.running = false
        clearTimeout(clock.flagTimer)
        clearTimeout(clock.firstMoveTimer)
        clock.firstMoveDeadline = null
        entry.game.white_time_remaining = Math.round(clock.remaining.w / 1000)
        entry.game.black_time_remaining = Math.round(clock.remaining.b / 1000)

        entry.game.status = status
        entry.game.winner_id = winnerID
        entry.game.draw_reason = drawReason
        entry.game.moves = entry.chess.history()
        entry.game.fen = entry.chess.fen()

        // wins, losses and draws change ratings; aborted games don't ("after" stays NULL)
        const isRated = status === "draw" || (status === "finished" && winnerID != null)
        if (isRated) {
            let whiteScore = 0.5
            if (status === "finished") whiteScore = winnerID === entry.whitePlayer.id ? 1 : 0

            const newRatings = calculateRatings(entry.game.white_elo_before, entry.game.black_elo_before, whiteScore)
            entry.game.white_elo_after = newRatings.white
            entry.game.black_elo_after = newRatings.black
        }

        // remove before the async save so no other action can end the game twice;
        // finished games are served from the DB from now on
        gameStore.delete(gameID)

        try {
            // the game and both ratings are saved together or not at all
            await db.tx(async (t) => {
                await t.none(`
                    UPDATE games
                    SET status = $1,
                        winner_id = $2,
                        draw_reason = $3,
                        moves = $4,
                        fen = $5,
                        white_time_remaining = $6,
                        black_time_remaining = $7,
                        white_elo_after = $8,
                        black_elo_after = $9,
                        ended_at = NOW()
                    WHERE id = $10`, [
                    entry.game.status,
                    entry.game.winner_id,
                    entry.game.draw_reason,
                    entry.game.moves,
                    entry.game.fen,
                    entry.game.white_time_remaining,
                    entry.game.black_time_remaining,
                    entry.game.white_elo_after ?? null,
                    entry.game.black_elo_after ?? null,
                    entry.game.id
                ])

                if (isRated) {
                    // $1:name inserts the column as an SQL identifier; it comes from a fixed map
                    const column = RATING_COLUMNS[entry.game.rating_category]
                    await t.none(`UPDATE users SET $1:name = $2 WHERE id = $3`, [column, entry.game.white_elo_after, entry.whitePlayer.id])
                    await t.none(`UPDATE users SET $1:name = $2 WHERE id = $3`, [column, entry.game.black_elo_after, entry.blackPlayer.id])
                }
            })
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

        // a move that arrives after the mover's time ran out loses on time instead
        const remainingBeforeMove = this.getRemaining(entry, senderColor)
        if (remainingBeforeMove <= 0) {
            await this.handleClockTimeout(gameID)
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

        // stop the mover's clock, add the increment and start the opponent's clock
        entry.clock.remaining[senderColor] = remainingBeforeMove + entry.clock.increment
        entry.clock.turnStartedAt = Date.now()

        // a move cancels the mover's own draw offer and lets them offer again
        if (entry.drawOffer?.from === userID) {
            entry.drawOffer = null
        }
        entry.drawBlocked.delete(userID)

        // checkmate, stalemate, insufficient material etc. end the game right away
        if (entry.chess.isGameOver()) {
            await this.finishGame(gameID)
            return {success: true}
        }

        this.scheduleClock(gameID)

        // white's first move starts black's first-move deadline; black's first move clears it
        if (entry.chess.history().length <= 2) {
            this.scheduleFirstMove(gameID)
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
