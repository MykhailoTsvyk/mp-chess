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
            return {success: false, message: e.message}
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
            await db.query(`INSERT INTO activation_tokens (user_id, token) VALUES ($1, $2)`, [userID, token])
            return `${process.env.API_URL}/activate/${token}`
        } catch (e) {
            console.log(e)
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

    async activate(activationLink){
        try {
            const userID = await db.query(`SELECT user_id FROM activation_tokens WHERE token = $1`, [activationLink])
            await db.query(`UPDATE users SET is_activated = TRUE WHERE id = $1`, [userID[0].user_id])
            await db.query(`DELETE FROM activation_tokens WHERE user_id = $1`, [userID[0].user_id])
        } catch (e) {
            console.log(e)
        }
    }
}

export default new userService()