import matchmakingService, {queueRoom, ALL_QUEUE_ROOMS, leaveAllQueues} from "../services/matchmaking.service.js";
import gameService from "../services/game.service.js";
import {gameStore} from "../store/game.store.js";
import {TIME_CONTROLS} from "../config/timeControls.js";

export const registerMatchmakingHandlers = (io, socket) => {
    // games ended by a clock or the first-move deadline are announced to the room
    const onTimerEnd = (entry) => io.to(entry.game.id).emit("game:updated", gameService.serialize(entry))

    socket.on("matchmaking:start", async (timeControlID) => {
        try {
            if (!TIME_CONTROLS[timeControlID]) return

            // a player already in a live game is sent back to it instead of being queued
            const activeGame = gameService.findActiveGameForUser(socket.user.id)
            if (activeGame) {
                socket.emit("matchmaking:activeGame", {gameID: activeGame.game.id})
                return
            }

            const currUserID = socket.user.id
            const socketsInQueues = await io.in(ALL_QUEUE_ROOMS).fetchSockets()

            // only one search per user: a search from another tab cancels the old one
            for (const connectedSocket of socketsInQueues) {
                if (connectedSocket.user.id === currUserID && connectedSocket.id !== socket.id) {
                    leaveAllQueues(connectedSocket)
                    connectedSocket.emit("matchmaking:cancelled")
                }
            }

            const room = queueRoom(timeControlID)
            leaveAllQueues(socket)
            await socket.join(room)
            socket.emit("matchmaking:queued", {
                status: "Looking for opponents",
                timeControl: timeControlID,
                totalPlayers: io.sockets.adapter.rooms.get(room)?.size || 0
            })

            const gameID = await matchmakingService.attemptFindMatch(io, timeControlID, onTimerEnd)
            const entry = gameStore.get(gameID)

            if (entry) {
                io.to(gameID).emit("matchmaking:matchFound", gameService.serialize(entry))
            }
        } catch (e) {
            console.error("Matchmaking error:", e)
        }
    })

    socket.on("matchmaking:cancel", () => {
        leaveAllQueues(socket)
    })

    socket.on("disconnecting", () => {
        leaveAllQueues(socket)
    })
}
