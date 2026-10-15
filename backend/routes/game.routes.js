import {Router} from "express";
import gameController from "../controllers/game.controller.js";


const router = new Router()

router.get("/game/:gameID", gameController.getGame)

export default router