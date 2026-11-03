import gameService from "./game.service.js";
import {TIME_CONTROLS} from "../config/timeControls.js";

// players are only matched with players who chose the same time control
export const queueRoom = (timeControlID) => `queue:${timeControlID}`
export const ALL_QUEUE_ROOMS = Object.keys(TIME_CONTROLS).map(queueRoom)

// works for both live sockets and the remote sockets returned by fetchSockets()
export const leaveAllQueues = (socket) => {
    for (const room of ALL_QUEUE_ROOMS) {
        socket.leave(room)
    }
}

class matchmakingService {
    // matchmaking attempts run one at a time, so two concurrent "matchmaking:start"
    // events can't pair the same sockets into two games
    #queue = Promise.resolve()

    attemptFindMatch(io, timeControlID, onTimerEnd) {
        const attempt = this.#queue.then(() => this.#findMatch(io, timeControlID, onTimerEnd))
        this.#queue = attempt.catch(() => {})
        return attempt
    }

    async #findMatch(io, timeControlID, onTimerEnd){
        const room = queueRoom(timeControlID)
        const socketsInQueue = await io.in(room).fetchSockets()

        const player1 = socketsInQueue[0]
        const player2 = socketsInQueue.find(s => s.user.id !== player1?.user.id)

        if (!player1 || !player2) {
            return
        }

        player1.leave(room)
        player2.leave(room)

        const gameRoomID = `game_${player1.user.id}_${player2.user.id}_${Date.now()}`

        try {
            return await gameService.start([player1, player2], gameRoomID, timeControlID, onTimerEnd)
        } catch (e) {
            console.error("Failed to start game:", e)
            // put both players back so they keep searching
            player1.join(room)
            player2.join(room)
        }
    }
}

export default new matchmakingService()
