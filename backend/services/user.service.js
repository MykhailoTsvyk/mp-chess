import userRepository from "../repositories/user.repository.js";
import {hash} from "bcrypt";

class userService {
    async registerUser (username, email, rawPass){
        try {
            console.log(username, email, rawPass)
            const hashedPass = await hash(rawPass, Number(process.env.SALT_ROUNDS) || 12)

            const newUser = await userRepository.saveNewUser(username, email, hashedPass)
            return {success: true, user: newUser}
        } catch (e) {
            return {success: false, message: e.message}
        }
    }
}

export default new userService()