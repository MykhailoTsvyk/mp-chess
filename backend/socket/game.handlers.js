import {gameStore} from "../store/game.store.js";
import gameService from "../services/game.service.js";

export const registerGameHandlers = (io,  socket) => {

    socket.on("game:started", () => {
        return gameStore.get(gameID)
    })

    socket.on("game:sync_state", (gameID) => {
        const isActive = gameStore.has(gameID)
        const entry = gameStore.get(gameID)

        // TO DO: check whether sender is one of the players
        if (isActive) {
            return {
                game: entry.game,
                whitePlayer: entry.whitePlayer,
                blackPlayer: entry.blackPlayer
            }
        }
    })

    socket.on("game:move", async (gameID, from, to) => {
        const moveData = await gameService.makeMove(socket.user.id, gameID, from, to)

        if (moveData.success) {
            io.to(gameID).emit("game:updated", moveData.gameData)
        }

    })


    //hanlder for user who disconnected to set 1min timer to allow him comeback, otherwise kick him and assign loss to his account
}