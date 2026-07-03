import userService from "../services/user.service.js";

class userController {
    async register(req, res) {
        const {username, email, password} = req.body
        try {
            const result = await userService.registerUser(username, email, password)
            res.json(result)
        } catch (e) {
            res.json(e)
        }

    }

    async login(req, res) {
        const {email, password} = req.body

        try {
            const result = await userService.loginUser(email, password)
            res.json(result)
        } catch (e) {
            res.status(401).json(e.message)
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