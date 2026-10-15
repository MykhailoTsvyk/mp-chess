import {Chess} from "chess.js";
import db from "../db/db.js";
import {gameStore} from "../store/game.store.js";

class gameService {

    // array of user IDs to randomly assign sides
    async start(users, gameRoomID) {
        const pivot = Math.floor(Math.random() * 2)
        const whitePlayerSocket = users[pivot] // 0 OR 1
        const blackPlayerSocket = users[pivot ? 0 : 1] // opposite side to white
        console.log(whitePlayerSocket)

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
        console.log(gameRecord[0])

        if (gameRecord !== null) {
            users[0].join(gameRoomID)
            users[1].join(gameRoomID)
        }

        gameStore.set(gameRoomID, {
            game: gameRecord[0],
            whitePlayer: whitePlayerSocket.user,
            blackPlayer: blackPlayerSocket.user,
            chess: new Chess(),
            messages: []
        })

        return gameRecord[0].id
    }

    async finishGame(gameID){
        const entry = gameStore.get(gameID)
        if (!entry) return

        const chess = entry.chess
        entry.game.status = "finished"
        entry.game.moves = chess.history()
        entry.game.fen = chess.fen()

        if (chess.isCheckmate()) {
            const winner = chess.turn() === "w" ? "Black" : "White"
            entry.game.winner_id = chess.turn() === "w" ? entry.blackPlayer.id : entry.whitePlayer.id
        } else if (chess.isDraw()) {
            entry.game.status = "draw"

            if (chess.isStalemate()) {
                entry.game.draw_reason = "Stalemate"
            } else if (chess.isInsufficientMaterial()) {
                entry.game.draw_reason = "Insufficient Material"
            } else if (chess.isThreefoldRepetition()) {
                entry.game.draw_reason = "Threefold Repetition"
            } else if (chess.isDrawByFiftyMoves()) {
                entry.game.draw_reason = "Draw by 50 moves rule"
            } else {
                entry.game.draw_reason = "Mutual Agreement Draw"
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
    }

    async makeMove(userID, gameID, from, to){
        const entry = gameStore.get(gameID)

        if (!entry) {
            return {success: false}
        }

        if (entry.chess.isGameOver()) {
            await this.finishGame(gameID)
            return {success: false, gameOver: true}
        }

        const senderColor = entry.blackPlayer?.id === userID ? "b" : "" || entry.whitePlayer?.id === userID ? "w" : ""

        if (senderColor === entry.chess.turn() && entry.chess.moves({verbose: true}).map(m => m.to).includes(to)) {
            entry.chess.move({from: from, to: to})
            entry.game.fen = entry.chess.fen()
            entry.game.moves = entry.chess.history()

            if (entry.chess.isGameOver()) {
                await this.finishGame(gameID)
            }

            return {
                success: true
            }
        } else {
            console.log("failed to move")
        }
    }


}

export default new gameService()