import {registerMatchmakingHandlers} from "./matchmaking.handlers.js";
import {registerGameHandlers} from "./game.handlers.js";
import { serverEventEmitter } from "../events/eventEmitter.js"

export const registerSocketHandlers = (io) => {
    // register it here so event listener is registered only once
    serverEventEmitter.on("notification:send", (notificationRecord) => {
        try {
            io.to(`user:${notificationRecord.user_id}`).emit("notification:new", notificationRecord)
        } catch (e) {
            console.log(e)
        }
    })

    io.on("connection", (socket) => {
        // join the room per user to get all his simultaneous connections
        socket.join(`user:${socket.user.id}`)

        registerMatchmakingHandlers(io, socket)
        registerGameHandlers(io, socket)
    })
}