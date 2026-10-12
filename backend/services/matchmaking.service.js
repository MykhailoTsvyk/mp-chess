import gameService from "./game.service.js";

class matchmakingService {

    async attemptFindMatch(io, socket){
        const socketsInQueue = await io.in("queue").fetchSockets()

        if (socketsInQueue.length < 2) {
            return
        }

        const player1 = socketsInQueue[0]
        const player2 = socketsInQueue[1]

        player1.leave("queue")
        player2.leave("queue")

        const gameRoomID = `game_${player1.user.id}_${player2.user.id}_${Date.now()}`

        return await gameService.start([player1, player2], gameRoomID)
    }
}

export default new matchmakingService()