import {Router} from "express";
import userController from "../controllers/user.controller.js";
import {validateRegistration, validateLogin, protectedAuthMiddleware} from "../middleware/auth.middleware.js";

const router = new Router()


router.post("/register", validateRegistration, userController.register)
router.post("/login", validateLogin, userController.login)
router.post("/activate/:link", userController.activate)
router.post("/refresh", userController.refresh)
router.get("/user:id", protectedAuthMiddleware, userController.getOneUser)
router.put("/user:id", userController.updateUser)
router.delete("/user:id", userController.deleteUser)

// redo activation function to produce new tokens where email is verified
router.post("/resend-activation", protectedAuthMiddleware, userController.resendActivation)

export default router