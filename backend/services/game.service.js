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
            chess: new Chess()
        })

        return gameRecord[0].id
    }

    // game should be object with all the info about game
    async finishGame(game){

    }

    async makeMove(userID, gameID, from, to){
        const entry = gameStore.get(gameID)

        if (!entry) {
            return {success: false}
        }

        if (entry.chess.isGameOver()) {
            const gameSummary = await this.finishGame()
            return {success: false, gameOver: true, summary: gameSummary}
        }

        const senderColor = entry.blackPlayer?.id === userID ? "b" : "w"

        if (senderColor === entry.chess.turn() && entry.chess.moves({verbose: true}).map(m => m.to).includes(to)) {
            entry.chess.move({from: from, to: to})
            entry.game.fen = entry.chess.fen()
            entry.game.moves = entry.chess.history()

            return {
                success: true,
                gameData: {
                    game: entry.game,
                    whitePlayer: entry.whitePlayer,
                    blackPlayer: entry.blackPlayer
                }
            }
        } else {
            console.log("failed to move")
        }
    }


}

export default new gameService()