import {gameStore} from "../store/game.store.js";
import gameService from "../services/game.service.js";

const MAX_MESSAGE_LENGTH = 150
const LEAVE_TIMEOUT_MS = 60 * 1000

// a player is present while any of their sockets (tabs) is in the game room
async function isPlayerPresent(io, gameID, userID, excludeSocketID = null) {
    const sockets = await io.in(gameID).fetchSockets()
    return sockets.some(s => s.user.id === userID && s.id !== excludeSocketID)
}

// starts the 1-minute timeout when a player has no sockets left in the game room
async function handlePlayerLeft(io, gameID, userID, excludeSocketID = null) {
    const entry = gameStore.get(gameID)
    if (!entry || !gameService.isPlayer(entry, userID)) return

    if (await isPlayerPresent(io, gameID, userID, excludeSocketID)) return

    const started = gameService.startLeaveTimer(gameID, userID, LEAVE_TIMEOUT_MS, async () => {
        try {
            const current = gameStore.get(gameID)
            if (!current) return

            // the player might have come back without the timer being cancelled
            if (await isPlayerPresent(io, gameID, userID)) {
                gameService.cancelLeaveTimer(gameID, userID)
                io.to(gameID).emit("game:updated", gameService.serialize(current))
                return
            }

            const opponentID = gameService.getOpponentID(current, userID)
            const isOpponentPresent = await isPlayerPresent(io, gameID, opponentID)

            await gameService.resolveAbandonment(gameID, userID, isOpponentPresent)
            io.to(gameID).emit("game:updated", gameService.serialize(current))
        } catch (e) {
            console.error("Failed to resolve abandoned game:", e)
        }
    })

    if (started) {
        io.to(gameID).emit("game:updated", gameService.serialize(entry))
    }
}

export const registerGameHandlers = (io,  socket) => {

    // runs a game action and broadcasts the new state if it succeeded
    const gameAction = (name, action) => async (gameID, ...args) => {
        try {
            // keep a reference: finished games are removed from the store
            const entry = gameStore.get(gameID)
            if (!entry) return

            const result = await action(gameID, ...args)

            if (result.success) {
                io.to(gameID).emit("game:updated", gameService.serialize(entry))
            }
        } catch (e) {
            console.error(`Failed to process ${name}:`, e)
        }
    }

    // players and spectators join the game room and receive the current state
    socket.on("game:sync-state", (gameID) => {
        const entry = gameStore.get(gameID)
        if (!entry) return

        socket.join(gameID)

        // a returning player stops their leave timer; tell everyone in the room
        if (gameService.cancelLeaveTimer(gameID, socket.user.id)) {
            io.to(gameID).emit("game:updated", gameService.serialize(entry))
        } else {
            socket.emit("game:updated", gameService.serialize(entry))
        }
    })

    // the client left the game page without disconnecting
    socket.on("game:leave", async (gameID) => {
        try {
            if (!gameStore.has(gameID)) return

            socket.leave(gameID)
            await handlePlayerLeft(io, gameID, socket.user.id)
        } catch (e) {
            console.error("Failed to process leave:", e)
        }
    })

    // the socket is still in its rooms here, so exclude it from the presence check
    socket.on("disconnecting", () => {
        for (const room of socket.rooms) {
            if (!gameStore.has(room)) continue

            handlePlayerLeft(io, room, socket.user.id, socket.id)
                .catch(e => console.error("Failed to process disconnect:", e))
        }
    })

    socket.on("game:move", gameAction("move", (gameID, from, to, promotion) =>
        gameService.makeMove(socket.user.id, gameID, from, to, promotion)))

    socket.on("game:resign", gameAction("resign", (gameID) =>
        gameService.resign(socket.user.id, gameID)))

    socket.on("game:offer-draw", gameAction("draw offer", (gameID) =>
        gameService.offerDraw(socket.user.id, gameID)))

    socket.on("game:respond-draw", gameAction("draw response", (gameID, accept) =>
        gameService.respondDraw(socket.user.id, gameID, accept === true)))

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
