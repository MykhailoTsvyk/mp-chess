import userService from "../services/user.service.js";
import emailService from "../services/email.service.js";
import jwt from "jsonwebtoken";
import db from "../db/db.js";
import tokenService from "../services/token.service.js";
import userDto from "../dtos/user.dto.js";

// 36:32
class userController {
    async register(req, res) {
        const {username, email, password} = req.body
        try {
            const userData = await userService.registerUser(username, email, password)
            const link = await userService.generateActivationLink(userData.user.id)
            await emailService.sendActivationEmail(userData.user, link)
            res.cookie('refreshToken', userData.refresh, {maxAge: 14 * 24 * 60 * 60 * 1000, httpOnly: true})
            res.json({access: userData.access, user: userData.user})
        } catch (e) {
            res.status(e.status || 400).json({
                message: e.message || 'Registration error'
            })
        }

    }

    async login(req, res) {
        const {email, password} = req.body

        try {
            const result = await userService.loginUser(email, password)
            res.cookie('refreshToken', result.refresh, {maxAge: 14 * 24 * 60 * 60 * 1000, httpOnly: true})
            res.json({
                access: result.access,
                user: result.user
            })
        } catch (e) {
            res.status(401).json(e.message)
        }
    }

    async activate(req, res) {
        try {
            const activationLink = req.params.link

            const user = await userService.activate(activationLink)

            const tokens = tokenService.generateTokens({
                id: user.id,
                username: user.username,
                email: user.email,
                created_at: user.created_at,
                is_activated: user.is_activated,
                elo: user.elo
            })

            await tokenService.saveToken(user.id, tokens.refresh)

            res.cookie("refreshToken", tokens.refresh, {
                httpOnly: true,
                maxAge: 30 * 24 * 60 * 60 * 1000,
            })

            return res.json({
                accessToken: tokens.access,
                user: new userDto(user)
            })

        } catch (e) {
            console.log(e)

            return res.status(400).json({
                message: e.message
            })
        }
    }


    async resendActivation(req, res){
        try {
            console.log(req.user)
            const user = jwt.decode(req.cookies.refreshToken, process.env.JWT_REFRESH_SECRET)
            const activationLink = await userService.generateActivationLink(user.id)
            await emailService.sendActivationEmail(new userDto(user), activationLink)
            console.log(activationLink)
            return res.status(200).json({
                message: "Link was sent to the email!"
            })
        } catch (e) {
            console.log(e)
            res.status(400).json({
                message: "Error: Activation link was not sent"
            })
        }
    }

    async refresh(req, res){
        try {
            const {refreshToken} = req.cookies
            const tokens = await userService.refresh(refreshToken)
            res.cookie('refreshToken', tokens.refresh, {maxAge: 14 * 24 * 60 * 60 * 1000, httpOnly: true})
            res.json({access: tokens.access, user: tokens.user})
        } catch (e) {
            res.status(401).json({
                message: e
            })
        }

    }

    async getOneUser(req, res) {

    }

    async updateUser(req, res) {

    }

    async deleteUser(req, res) {

    }

}

export default new userController()