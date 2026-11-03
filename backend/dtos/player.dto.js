import {RATING_COLUMNS} from "../config/timeControls.js";

// Public user info that is safe to broadcast to opponents and spectators (no email);
// elo is the player's rating in the game's category (bullet / blitz / rapid)
class PlayerDto {
    id;
    username;
    elo;

    constructor(model, category) {
        this.id = model.id
        this.username = model.username
        this.elo = category ? model[RATING_COLUMNS[category]] : undefined
    }
}

export default PlayerDto
