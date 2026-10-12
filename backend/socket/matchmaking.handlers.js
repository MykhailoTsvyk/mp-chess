import matchmakingService from "../services/matchmaking.service.js";
import {gameStore} from "../store/game.store.js";

export const registerMatchmakingHandlers = (io, socket) => {
    socket.on("matchmaking:start", async () => {
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

        if (gameID) {
            console.log(entry.turn)
            io.to(gameID).emit("matchmaking:matchFound", {
                game: entry.game,
                whitePlayer: entry.whitePlayer,
                blackPlayer: entry.blackPlayer
            })
        }
        // console.log(io.sockets.adapter.rooms.get(gameData.gameRoomID))
        // console.log(`User id: ${currUserID} (Socket ${socket.id}) is now in the queue.`);
    })

    socket.on("matchmaking:cancel", () => {
        socket.leave("queue")
    })

    socket.on("disconnecting", () => {
        socket.leave("queue")
        console.log("user disconnected, size of queue room: ", io.sockets.adapter.rooms.get("queue")?.size || 0)
    })
}