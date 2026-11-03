import db from "../db/db.js";
import PlayerDto from "../dtos/player.dto.js";
import gameService from "../services/game.service.js";


class gameController {
    // the logged-in user's game in progress, so the home page can offer to return to it
    async getActiveGame(req, res) {
        const entry = gameService.findActiveGameForUser(req.user.id)

        if (!entry) {
            return res.json({activeGame: null})
        }

        const isWhite = entry.whitePlayer.id === req.user.id

        return res.json({
            activeGame: {
                id: entry.game.id,
                timeControl: entry.timeControl,
                color: isWhite ? "w" : "b",
                opponent: isWhite ? entry.blackPlayer : entry.whitePlayer
            }
        })
    }

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
