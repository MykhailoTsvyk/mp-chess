import * as bc from "bcrypt";
import db from "../db/db.js";

class userService {
    async registerUser (username, email, rawPass){
        try {
            const hashedPass = await bc.hash(rawPass, Number(process.env.SALT_ROUNDS) || 12)

            const candidate = await db.query(`INSERT INTO users(username, email, password) VALUES ($1, $2, $3) RETURNING *`,
                [username, email, hashedPass])
            console.log(candidate)
            return {success: true, user: candidate}
        } catch (e) {
            return {success: false, message: e.message}
        }
    }

    async loginUser (email, password){
        try {
            const user = await db.query(`SELECT * FROM users WHERE email = $1`, [email])

            if (user.length > 0) {
                const hashedPass = user[0].password
                const isValidPass = await bc.compare(password, hashedPass)

                if (isValidPass) {
                    return {
                        id: user[0].id,
                        username: user[0].username,
                        email: user[0].email,
                        created_at: user[0].created_at
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
}

export default new userService()