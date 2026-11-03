import {Router} from "express";
import gameController from "../controllers/game.controller.js";
import {protectedAuthMiddleware} from "../middleware/auth.middleware.js";


const router = new Router()

router.get("/active-game", protectedAuthMiddleware, gameController.getActiveGame)
router.get("/game/:gameID", gameController.getGame)

export default router