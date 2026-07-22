import jwt from "jsonwebtoken"
import db from "../db/db.js";

class tokenService {

    generateTokens(payload){
        const access = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {expiresIn: "30m"})
        const refresh = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {expiresIn: "14d"})

        return {
            access,
            refresh
        }
    }

    validateAccess(accessToken){
        try {
            return jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET)
        } catch (e) {
            return null
        }
    }

    validateRefresh(refreshToken) {
        try {
            return jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
        } catch (e) {
            return null
        }
    }

    // save token to db OR replace it if it exists
    async saveToken(userID, refreshToken) {
        const existingToken = await db.query(`SELECT * FROM tokens WHERE user_id = $1`, [userID])

        // IF user exists then update token
        if (existingToken.length > 0) {
            return await db.query(
                `UPDATE tokens SET refresh_token = $1 WHERE user_id = $2`,
                [refreshToken, userID]
            )
        }
        // Create row in db if token is asked for the first time
        const token = await db.query(`INSERT INTO tokens (refresh_token, user_id) VALUES ($1, $2) RETURNING *`, [refreshToken, userID])
        return token[0]
    }
}

export default new tokenService()