import userService from "../services/user.service.js";
import emailService from "../services/email.service.js";
import tokenService from "../services/token.service.js";
import userDto from "../dtos/user.dto.js";

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
                maxAge: 14 * 24 * 60 * 60 * 1000,
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
            // req.user is the verified access token payload set by protectedAuthMiddleware
            const user = req.user
            const activationLink = await userService.generateActivationLink(user.id)
            await emailService.sendActivationEmail(new userDto(user), activationLink)
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
                message: e.message
            })
        }

    }

    async getOneUser(req, res) {
        const userID = Number(req.params.id)

        if (!Number.isInteger(userID)) {
            return res.status(400).json({message: "Invalid user id"})
        }

        try {
            const profile = await userService.getProfile(userID, req.user.id)

            if (!profile) {
                return res.status(404).json({message: "User not found"})
            }

            return res.json(profile)
        } catch (e) {
            console.log(e)
            return res.status(500).json({message: "Internal server error"})
        }
    }

    // TO DO: implement; respond so requests don't hang until then
    async updateUser(req, res) {
        res.status(501).json({message: "Not implemented"})
    }

    async deleteUser(req, res) {
        res.status(501).json({message: "Not implemented"})
    }

}

export default new userController()