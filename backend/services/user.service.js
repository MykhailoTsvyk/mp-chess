import * as bc from "bcrypt";
import db from "../db/db.js";
import tokenService from "./token.service.js";
import UserDto from "../dtos/user.dto.js";
import crypto from "crypto";

function ratingChange(before, after) {
    return before != null && after != null ? after - before : null
}

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
            SELECT u.id, u.username, u.email, u.is_activated, u.created_at,
                   u.elo_bullet, u.elo_blitz, u.elo_rapid,
                   s.games_played, s.wins, s.losses, s.draws,
                   s.bullet_games, s.blitz_games, s.rapid_games
            FROM users u
            CROSS JOIN LATERAL (
                SELECT
                    COUNT(*)::int AS games_played,
                    COUNT(*) FILTER (WHERE g.winner_id = u.id)::int AS wins,
                    COUNT(*) FILTER (WHERE g.status = 'finished' AND g.winner_id IS DISTINCT FROM u.id)::int AS losses,
                    COUNT(*) FILTER (WHERE g.status = 'draw')::int AS draws,
                    COUNT(*) FILTER (WHERE g.rating_category = 'bullet')::int AS bullet_games,
                    COUNT(*) FILTER (WHERE g.rating_category = 'blitz')::int AS blitz_games,
                    COUNT(*) FILTER (WHERE g.rating_category = 'rapid')::int AS rapid_games
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
            created_at: profile.created_at,
            // games played per category only counts games that have a category (older games don't)
            ratings: {
                bullet: {rating: profile.elo_bullet, games: profile.bullet_games},
                blitz: {rating: profile.elo_blitz, games: profile.blitz_games},
                rapid: {rating: profile.elo_rapid, games: profile.rapid_games}
            },
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

    async getUserMatches(userID, limit = 5, offset = 0) {
        const user = await db.oneOrNone(`SELECT id FROM users WHERE id = $1`, [userID])
        if (!user) {
            return null
        }

        const rows = await db.any(`
            SELECT g.id, g.status, g.draw_reason, g.rating_category, g.ended_at,
                   g.initial_time_control, g.increment_time_control,
                   COALESCE(cardinality(g.moves), 0) AS plies,
                   CASE WHEN g.white_player = $1 THEN 'white' ELSE 'black' END AS color,
                   CASE
                       WHEN g.status = 'draw' THEN 'draw'
                       WHEN g.winner_id = $1 THEN 'win'
                       ELSE 'loss'
                   END AS result,
                   g.white_elo_before, g.white_elo_after,
                   g.black_elo_before, g.black_elo_after,
                   w.id AS white_id, w.username AS white_username,
                   b.id AS black_id, b.username AS black_username
            FROM games g
            LEFT JOIN users w ON w.id = g.white_player
            LEFT JOIN users b ON b.id = g.black_player
            WHERE (g.white_player = $1 OR g.black_player = $1)
              AND g.status IN ('finished', 'draw')
            ORDER BY g.ended_at DESC NULLS LAST, g.id
            LIMIT $2 OFFSET $3`, [userID, limit, offset])

        return rows.map((row) => {
            const isWhite = row.color === "white"

            return {
                id: row.id,
                result: row.result,
                color: row.color,
                draw_reason: row.draw_reason,
                white: {
                    id: row.white_id,
                    username: row.white_username,
                    rating: row.white_elo_before,
                    change: ratingChange(row.white_elo_before, row.white_elo_after)
                },
                black: {
                    id: row.black_id,
                    username: row.black_username,
                    rating: row.black_elo_before,
                    change: ratingChange(row.black_elo_before, row.black_elo_after)
                },
                rating_category: row.rating_category,
                time_control: {initial: row.initial_time_control, increment: row.increment_time_control},
                rating_change: isWhite
                    ? ratingChange(row.white_elo_before, row.white_elo_after)
                    : ratingChange(row.black_elo_before, row.black_elo_after),
                moves: Math.ceil(row.plies / 2),
                ended_at: row.ended_at
            }
        })
    }

}

export default new userService()