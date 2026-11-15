import notificationService from "../services/notification.service.js"

class notificationController {
    async getUnreadCount(req, res){
        const userID = req.user.id

        try {
            const unreadCount = await notificationService.getUnreadCount(userID)

            res.status(200).json({unreadCount: unreadCount})
        } catch (e) {
            console.error(e)
            res.status(500).json({message: "Error: unreadCount failed to load"})
        }
    }

    async getNotifications(req, res) {
        const userID = req.user.id
        const limit = req.params.limit === undefined ? 10 : Number(req.params.limit)

        if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
            return res.status(400).json({message: "Error: Invalid limit"})
        }

        try {
            const notifications = await notificationService.getNotifications(userID, limit)

            res.status(200).json({notifications: notifications})

        } catch (e) {
            console.error(e)
            res.status(500).json({message: "Error: notifications failed to load"})
        }
    }

    async markAsRead(req, res) {
        const notificationID = Number(req.params.notificationID)

        if (!Number.isInteger(notificationID) || notificationID < 1) return res.status(400).json({message: "Error: notificationID is not a valid number"})

        const userID = req.user.id
        try {
             const isMarked = await notificationService.markAsRead(userID, notificationID)
             if (isMarked) {
                return res.status(204).end()
             }

             return res.status(404).end()
             
        } catch (e) {
            console.error(e)
            return res.status(500).json({message: "Error: Failed to mark message as marked"})
        }
    }

    async markAllAsRead(req, res) {
        const userID = req.user.id
        try {
            await notificationService.markAllAsRead(userID)
            res.status(204).end()
        } catch (e) {
            console.error(e)
            res.status(500).json({message: "Error: Failed to mark all messages as read"})
        }
    }
}

export default new notificationController()