import { Router } from "express";
import { protectedAuthMiddleware } from "../middleware/auth.middleware.js";
import notificationController from "../controllers/notification.controller.js";

const router = new Router()

router.get("/unread-count", protectedAuthMiddleware, notificationController.getUnreadCount)
router.get("{/:limit}", protectedAuthMiddleware, notificationController.getNotifications)
router.post("/read/:notificationID", protectedAuthMiddleware, notificationController.markAsRead)
router.post("/read-all", protectedAuthMiddleware, notificationController.markAllAsRead)

export default router