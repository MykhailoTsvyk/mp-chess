import * as bc from "bcrypt";
import db from "../db/db.js";
import tokenService from "./token.service.js";
import UserDto from "../dtos/user.dto.js";
import crypto from "crypto";

class userService {
    async registerUser (username, email, rawPass){
        try {
            const hashedPass = await bc.hash(rawPass, Number(process.env.SALT_ROUNDS) || 12)

            const candidate = await db.query(`INSERT INTO users(username, email, password) VALUES ($1, $2, $3) RETURNING *`,
                [username, email, hashedPass])
            const newUserDto = new UserDto(candidate[0])
            const tokens = tokenService.generateTokens({...newUserDto})
            await tokenService.saveToken(newUserDto.id, tokens.refresh)

            return {
                ...tokens,
                user: newUserDto
            }
        } catch (e) {
            // 23505 = unique_violation (username or email already registered)
            if (e.code === "23505") {
                const field = e.constraint?.includes("email") ? "Email" : "Username"
                const error = new Error(`${field} is already taken`)
                error.status = 409
                throw error
            }
            throw e
        }
    }

    async loginUser (email, password){
        try {
            const user = await db.query(`SELECT * FROM users WHERE email = $1`, [email])

            // check if user is returned
            if (user.length > 0) {
                const hashedPass = user[0].password
                const isValidPass = await bc.compare(password, hashedPass)
                const newUserDto = new UserDto(user[0])

                if (isValidPass) {
                    const tokens = tokenService.generateTokens({...newUserDto})
                    await tokenService.saveToken(newUserDto.id, tokens.refresh)
                    return {
                        ...tokens,
                        user: newUserDto
                    }
                } else {
                    throw new Error("Invalid password")
                }

            } else {
                throw new Error("User does not exist")
            }

        } catch (e) {
            throw e
        }
    }

    async generateActivationLink(userID){
        try {
            const token = crypto.randomBytes(32).toString("hex")
            await db.query(`
                INSERT INTO activation_tokens (user_id, token)
                VALUES ($1, $2)
                ON CONFLICT (user_id)
                DO UPDATE SET
                token = EXCLUDED.token`, [userID, token])

            return `${process.env.CLIENT_URL}/activation/${token}`
        } catch (e) {
            console.log(e)
            throw e
        }
    }

    async refresh(refreshToken){
        if (!refreshToken) {
            throw new Error("Unauthorized")
        }

        const payload = tokenService.validateRefresh(refreshToken)
        if (!payload) {
            throw new Error("Invalid refresh token")
        }

        const tokenFromDb = await db.oneOrNone(`SELECT refresh_token FROM tokens WHERE refresh_token = $1`, [refreshToken])
        if (!tokenFromDb) {
            throw new Error("Refresh token not found")
        }

        const user = await db.one(`SELECT * FROM users WHERE id = $1`, [payload.id])
        const userDto = new UserDto(user)

        const newTokens = tokenService.generateTokens({...userDto})
        await tokenService.saveToken(userDto.id, newTokens.refresh)

        return {
            ...newTokens,
            user: userDto
        }
    }

    // public profile with game stats; email and activation status only for the owner
    async getProfile(userID, viewerID) {
        // stats are counted in the DB, so no games are sent over the wire
        const profile = await db.oneOrNone(`
            SELECT u.id, u.username, u.email, u.is_activated, u.elo, u.created_at,
                   s.games_played, s.wins, s.losses, s.draws
            FROM users u
            CROSS JOIN LATERAL (
                SELECT
                    COUNT(*)::int AS games_played,
                    COUNT(*) FILTER (WHERE g.winner_id = u.id)::int AS wins,
                    COUNT(*) FILTER (WHERE g.status = 'finished' AND g.winner_id IS DISTINCT FROM u.id)::int AS losses,
                    COUNT(*) FILTER (WHERE g.status = 'draw')::int AS draws
                FROM games g
                WHERE (g.white_player = u.id OR g.black_player = u.id)
                  AND g.status IN ('finished', 'draw')
            ) s
            WHERE u.id = $1`, [userID])

        if (!profile) {
            return null
        }

        const isOwner = profile.id === viewerID

        return {
            id: profile.id,
            username: profile.username,
            elo: profile.elo,
            created_at: profile.created_at,
            stats: {
                games_played: profile.games_played,
                wins: profile.wins,
                losses: profile.losses,
                draws: profile.draws
            },
            ...(isOwner && {email: profile.email, is_activated: profile.is_activated})
        }
    }

    // ADD check whether user is already activated in order to avoid useless links requesting
    async activate(activationLink) {
        try {

            const result = await db.oneOrNone(
                `SELECT user_id FROM activation_tokens WHERE token = $1`,
                [activationLink]
            )

            if (!result) {
                throw new Error("Invalid activation link")
            }

            const user = await db.one(
                `UPDATE users
                SET is_activated = TRUE
                WHERE id = $1
                RETURNING *`, [result.user_id])

            await db.query(`DELETE FROM activation_tokens WHERE user_id = $1`, [result.user_id])

            return user

        } catch (e) {
            console.log(e)
            throw e
        }
    }

}

export default new userService()