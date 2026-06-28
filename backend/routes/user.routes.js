import {Router} from "express";
import userController from "../controllers/user.controller.js";

const router = new Router()

router.get("/user", userController.getUsers)
router.post("/user", userController.createUser)
router.get("/user:id", userController.getOneUser)
router.put("/user:id", userController.updateUser)
router.delete("/user:id", userController.deleteUser)

export default router