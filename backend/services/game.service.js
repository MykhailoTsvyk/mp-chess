class gameService {

    // array of user IDs to randomly assign sides
    async start(users) {
        const whitePlayer = users[Math.floor(Math.random() * 2)]
        const blackPlayer = users[whitePlayer ? 0 : 1]


    }

    // game should be object with all the info about game
    async finishGame(game){

    }

    // async setWinner(gameID, winnerID) {
    //
    // }
    //
    // async setDraw(gameID, drawReason){
    //
    // }
}

export default new gameService()