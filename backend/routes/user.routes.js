import {Router} from "express";
import userController from "../controllers/user.controller.js";
import {validateRegistration, validateLogin} from "../middleware/auth.middleware.js";

const router = new Router()


router.post("/register", validateRegistration, userController.register)
router.post("/login", validateLogin, userController.login)
router.get("/user:id", userController.getOneUser)
router.put("/user:id", userController.updateUser)
router.delete("/user:id", userController.deleteUser)

export default router