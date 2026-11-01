// Public user info that is safe to broadcast to opponents and spectators (no email)
class PlayerDto {
    id;
    username;
    elo;

    constructor(model) {
        this.id = model.id
        this.username = model.username
        this.elo = model.elo
    }
}

export default PlayerDto
