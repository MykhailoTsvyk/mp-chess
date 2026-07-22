import userService from "../services/user.service.js";
import emailService from "../services/email.service.js";
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
            res.json(e)
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

    async activate(req, res){
        try {
            const activationLink = req.params.link
            await userService.activate(activationLink)
            return res.redirect(process.env.CLIENT_URL)
        } catch (e) {
            console.log(e)
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