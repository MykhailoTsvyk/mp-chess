import gameService from "./game.service.js";

class matchmakingService {
    // matchmaking attempts run one at a time, so two concurrent "matchmaking:start"
    // events can't pair the same sockets into two games
    #queue = Promise.resolve()

    attemptFindMatch(io, socket) {
        const attempt = this.#queue.then(() => this.#findMatch(io, socket))
        this.#queue = attempt.catch(() => {})
        return attempt
    }

    async #findMatch(io, socket){
        const socketsInQueue = await io.in("queue").fetchSockets()

        const player1 = socketsInQueue[0]
        const player2 = socketsInQueue.find(s => s.user.id !== player1?.user.id)

        if (!player1 || !player2) {
            return
        }

        player1.leave("queue")
        player2.leave("queue")

        const gameRoomID = `game_${player1.user.id}_${player2.user.id}_${Date.now()}`

        try {
            return await gameService.start([player1, player2], gameRoomID)
        } catch (e) {
            console.error("Failed to start game:", e)
            // put both players back so they keep searching
            player1.join("queue")
            player2.join("queue")
        }
    }
}

export default new matchmakingService()
