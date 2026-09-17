export const registerMatchmakingHandlers = (io, socket) => {
    socket.on("matchmaking:start", () => {
        socket.join("queue")
        console.log(io.sockets.adapter)
        console.log(socket.user)

        socket.emit("matchmaking:queued", {
            status: "Searching",
            message: "Searching for opponent"
        })
    })

}