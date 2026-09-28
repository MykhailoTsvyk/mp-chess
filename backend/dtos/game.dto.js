class GameDto {
    id;
    status;
    whitePlayer;
    blackPlayer;
    winnerID;
    drawReason;
    moves;
    fen;

    constructor(model) {
        this.id = model.id
        this.status = model.status
        this.whitePlayer = model.whitePlayer
        this.blackPlayer = model.blackPlayer
        this.winnerID = model.winnerID
        this.drawReason = model.drawReason
        this.moves = model.moves
        this.fen = model.fen
    }
}

export default GameDto