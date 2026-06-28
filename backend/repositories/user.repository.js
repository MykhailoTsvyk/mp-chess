import db from "../db/db.js"

class userRepository {
    async saveNewUser(username, email, hashedPass){
        console.log(hashedPass)
        try {
            return await db.query(`INSERT INTO users(username, email, password) VALUES ($1, $2, $3) RETURNING *`, [username, email, hashedPass])
        } catch (e) {
            return e.message
        }
    }
}

export default new userRepository()