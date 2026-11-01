import matchmakingService from "../services/matchmaking.service.js";
import gameService from "../services/game.service.js";
import {gameStore} from "../store/game.store.js";

export const registerMatchmakingHandlers = (io, socket) => {
    socket.on("matchmaking:start", async () => {
        try {
            const currUserID = socket.user.id
            const socketsInQueue = await io.in("queue").fetchSockets()

            for (const connectedSocket of socketsInQueue) {
                if (connectedSocket.user.id === currUserID && connectedSocket.id !== socket.id) {
                    connectedSocket.leave("queue")
                    connectedSocket.emit("matchmaking:cancelled")
                }
            }

            await socket.join("queue")
            socket.emit("matchmaking:queued", {
                status: "Looking for opponents",
                totalPlayers: io.sockets.adapter.rooms.get("queue")?.size || 0
            })

            const gameID = await matchmakingService.attemptFindMatch(io, socket)
            const entry = gameStore.get(gameID)

            if (entry) {
                io.to(gameID).emit("matchmaking:matchFound", gameService.serialize(entry))
            }
        } catch (e) {
            console.error("Matchmaking error:", e)
        }
    })

    socket.on("matchmaking:cancel", () => {
        socket.leave("queue")
    })

    socket.on("disconnecting", () => {
        socket.leave("queue")
        console.log("user disconnected, size of queue room: ", io.sockets.adapter.rooms.get("queue")?.size || 0)
    })
}
