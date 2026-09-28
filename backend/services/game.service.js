import {Chess} from "chess.js";

class gameService {

    // array of user IDs to randomly assign sides
    async start(users) {
        const pivot = Math.floor(Math.random() * 2)
        const whitePlayerSocket = users[pivot] // 0 OR 1
        const blackPlayerSocket = users[pivot ? 0 : 1] // opposite side to white

        const chess = new Chess()
        console.log(chess)
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

    validateMove(move){

    }


}

export default new gameService()