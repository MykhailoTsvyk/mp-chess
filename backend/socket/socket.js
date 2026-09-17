import {registerMatchmakingHandlers} from "./matchmaking.handlers.js";

export const registerSocketHandlers = (io) => {
    io.on("connection", (socket) => {
        console.log("user connected:", socket.user)

        registerMatchmakingHandlers(io, socket)
    })
}