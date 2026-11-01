import {gameStore} from "../store/game.store.js";
import gameService from "../services/game.service.js";

const MAX_MESSAGE_LENGTH = 150

export const registerGameHandlers = (io,  socket) => {

    // players and spectators join the game room and receive the current state
    socket.on("game:sync-state", (gameID) => {
        const entry = gameStore.get(gameID)
        if (!entry) return

        socket.join(gameID)
        socket.emit("game:updated", gameService.serialize(entry))
    })

    socket.on("game:move", async (gameID, from, to, promotion) => {
        try {
            // keep a reference: finished games are removed from the store
            const entry = gameStore.get(gameID)
            if (!entry) return

            const moveData = await gameService.makeMove(socket.user.id, gameID, from, to, promotion)

            if (moveData.success) {
                io.to(gameID).emit("game:updated", gameService.serialize(entry))
            }
        } catch (e) {
            console.error("Failed to process move:", e)
        }
    })
    //hanlder for user who disconnected to set 1min timer to allow him comeback, otherwise kick him and assign loss to his account


    // Game chat handlers
    socket.on("game:sent-message", (m) => {
        const entry = gameStore.get(m?.gameID)
        if (!entry || !socket.rooms.has(m.gameID)) return

        const text = typeof m.text === "string" ? m.text.trim().slice(0, MAX_MESSAGE_LENGTH) : ""
        if (!text) return

        // author and role come from the authenticated socket, never from the client
        let role = "Spectator"
        if (entry.whitePlayer.id === socket.user.id) role = "White Side Player"
        if (entry.blackPlayer.id === socket.user.id) role = "Black Side Player"

        entry.messages.push({
            gameID: m.gameID,
            author: {id: socket.user.id, username: socket.user.username},
            text,
            timestamp: new Date(),
            role
        })

        io.to(m.gameID).emit("game:updated", gameService.serialize(entry))
    })
}
