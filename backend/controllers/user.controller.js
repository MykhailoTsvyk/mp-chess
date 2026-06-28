import userService from "../services/user.service.js";

class userController {
    async createUser(req, res) {
        const {username, email, password} = req.body
        try {
            const result = await userService.registerUser(username, email, password)
            res.json(result)
        } catch (e) {
            res.json(e)
        }

    }

    async getUsers(req, res) {

    }

    async getOneUser(req, res) {

    }

    async updateUser(req, res) {

    }

    async deleteUser(req, res) {

    }
}

export default new userController()