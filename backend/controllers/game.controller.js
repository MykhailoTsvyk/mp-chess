import db from "../db/db.js";
import userDto from "../dtos/user.dto.js";


class gameController {
    async getGame(req, res) {
        const {gameID} = req.params

        try {
            const gameRecord = await db.query(`SELECT * FROM games WHERE id = $1`, [gameID])
            const whitePlayerRecord = await db.query(`SELECT * FROM users WHERE id = $1`, [gameRecord[0].white_player])
            const blackPlayerRecord = await db.query(`SELECT * FROM users WHERE id = $1`, [gameRecord[0].black_player])

            if (!gameRecord[0]) {
                res.status(404).json({error: "game not found with such id"})
            }

            res.status(200).json({
                game: gameRecord[0],
                whitePlayer: new userDto(whitePlayerRecord[0]),
                blackPlayer: new userDto(blackPlayerRecord[0])
            })


        } catch (e) {
            res.status(500).json({error: "Internal server error"})
        }
    }
}

export default new gameController()