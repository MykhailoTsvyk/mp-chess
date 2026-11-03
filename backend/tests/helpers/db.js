import db from "../../db/db.js"

export async function resetDatabase() {
    await db.none(`TRUNCATE games, tokens, activation_tokens, friendships, users RESTART IDENTITY CASCADE`)
}

let userCount = 0

export async function createUser({activated = true, bullet = 800, blitz = 800, rapid = 800} = {}) {
    userCount++
    return db.one(`
        INSERT INTO users (username, email, password, is_activated, elo_bullet, elo_blitz, elo_rapid)
        VALUES ($1, $2, 'not-a-real-hash', $3, $4, $5, $6)
        RETURNING *`,
        [`player${userCount}`, `player${userCount}@test.com`, activated, bullet, blitz, rapid])
}

export const getUser = (id) => db.one(`SELECT * FROM users WHERE id = $1`, [id])
export const getGameRow = (id) => db.oneOrNone(`SELECT * FROM games WHERE id = $1`, [id])
