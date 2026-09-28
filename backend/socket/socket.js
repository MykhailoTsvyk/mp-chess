import {registerMatchmakingHandlers} from "./matchmaking.handlers.js";
import {registerGameHandlers} from "./game.handlers.js";

export const registerSocketHandlers = (io) => {
    io.on("connection", (socket) => {
        registerMatchmakingHandlers(io, socket)
        registerGameHandlers(io, socket)
    })
}