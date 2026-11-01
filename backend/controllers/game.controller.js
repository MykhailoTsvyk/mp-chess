import db from "../db/db.js";
import PlayerDto from "../dtos/player.dto.js";


class gameController {
    async getGame(req, res) {
        const {gameID} = req.params

        try {
            const gameRecord = await db.oneOrNone(`SELECT * FROM games WHERE id = $1`, [gameID])

            if (!gameRecord) {
                return res.status(404).json({error: "game not found with such id"})
            }

            // players can be NULL if their account was deleted
            const whitePlayerRecord = await db.oneOrNone(`SELECT * FROM users WHERE id = $1`, [gameRecord.white_player])
            const blackPlayerRecord = await db.oneOrNone(`SELECT * FROM users WHERE id = $1`, [gameRecord.black_player])

            return res.status(200).json({
                game: gameRecord,
                whitePlayer: whitePlayerRecord ? new PlayerDto(whitePlayerRecord) : null,
                blackPlayer: blackPlayerRecord ? new PlayerDto(blackPlayerRecord) : null
            })
        } catch (e) {
            console.error("Failed to fetch game:", e)
            return res.status(500).json({error: "Internal server error"})
        }
    }
}

export default new gameController()
