import {gameStore} from "../store/game.store.js";
import gameService from "../services/game.service.js";

export const registerGameHandlers = (io,  socket) => {

    socket.on("game:started", () => {
        return gameStore.get(gameID)
    })

    socket.on("game:sync-state", (gameID) => {
        const isActive = gameStore.has(gameID)
        const entry = gameStore.get(gameID)

        // TO DO: check whether sender is one of the players
        if (isActive) {
            socket.join(gameID)
            socket.emit("game:updated", {
                game: entry.game,
                whitePlayer: entry.whitePlayer,
                blackPlayer: entry.blackPlayer,
                messages: entry.messages
            })

        }
    })

    socket.on("game:move", async (gameID, from, to) => {
        const moveData = await gameService.makeMove(socket.user.id, gameID, from, to)
        const entry = gameStore.get(gameID)

        if (moveData?.success || moveData?.gameOver) {
            io.to(gameID).emit("game:updated", {
                game: entry.game,
                whitePlayer: entry.whitePlayer,
                blackPlayer: entry.blackPlayer
            })
        }
    })
    //hanlder for user who disconnected to set 1min timer to allow him comeback, otherwise kick him and assign loss to his account


    // Game chat handlers
    socket.on("game:sent-message", (m) => {
        const entry = gameStore.get(m.gameID)
        entry?.messages?.push(m)

        io.to(m.gameID).emit("game:updated", {
            game: entry.game,
            whitePlayer: entry.whitePlayer,
            blackPlayer: entry.blackPlayer,
            messages: entry.messages
        })
    })
}