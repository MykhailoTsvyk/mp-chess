import { NOTIFICATION_TYPES } from "../config/notificationTypes.js";
import db from "../db/db.js"
import { serverEventEmitter } from "../events/eventEmitter.js";

class notificationService {

    async notify(userID, type, data) {
        if (!Object.values(NOTIFICATION_TYPES).includes(type)) {
            throw new Error("Unknown notification type")
        }

        // save first to db
        const notificationRecord = await db.one(`INSERT INTO notifications (user_id, type, data) VALUES ($1, $2, $3) RETURNING *`, [userID, type, data])
        
        if (notificationRecord) {
            serverEventEmitter.emit("notification:send", notificationRecord)
        }

    }

    async getUnreadCount(userID){
        const unreadRecord = await db.one(`SELECT COUNT(id)::int FROM notifications WHERE user_id = $1 AND read_at IS NULL`, [userID])

        return unreadRecord.count
    }

    async getNotifications(userID, limit = 10) {
        return await db.any(`SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`, [userID, limit])
    }

    async markAsRead(userID, notificationID) {
        const readRecord = await db.result(`UPDATE notifications SET read_at = COALESCE(read_at, NOW()) WHERE id = $1 AND user_id = $2`, [notificationID, userID])
        return readRecord.rowCount
    }

    async markAllAsRead(userID) {
        await db.none(`UPDATE notifications SET read_at = COALESCE(read_at, NOW()) WHERE user_id = $1 AND read_at IS NULL`, [userID])
    }

}

export default new notificationService()