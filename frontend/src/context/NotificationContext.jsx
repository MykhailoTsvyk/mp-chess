import {createContext, useContext, useEffect, useState} from "react";
import { useAuth } from "./AuthContext";
import api from "../api/axios";
import { useSocket } from "./SocketContext";

const NotificationContext = createContext(null)

export default function NotificationProvider({children}) {
    const {user, isAuthenticated} = useAuth()
    const {socket} = useSocket()
    const [notifications, setNotifications] = useState([])
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(true)

    const load = async () => {
        try {
            const response = await api.get("/notifications/50")
            setNotifications(response.data.notifications)
        } catch (e) {
            console.error(e)
            setError("Could not load notifications")
        } finally {
            setLoading(false)
        }
    }

    // effect for http connection
    useEffect(() => {
        if (!isAuthenticated) {
            setNotifications([])
            return
        }

        setError(null)
        load()
    }, [user?.id, isAuthenticated])

    // effect for socket connection
    useEffect(() => {
        function handleNewNotification(notification) {
            setNotifications(prev => [notification, ...prev])
        }

        socket.on("notification:new", handleNewNotification)

        return () => {
            socket.off("notification:new", handleNewNotification)
        }
    }, [socket])

    const unreadCount = notifications.filter((n) => !n.read_at).length

    const markAsRead = async (notification) => {
        if (notification.read_at) return

        try {
            const now = new Date().toISOString()
            setNotifications(prev => prev.map(n => n.id === notification.id ? {...n, read_at: now} : n))
            await api.post(`/notifications/read/${notification.id}`)
        } catch (e) {
            console.error(e)
            setNotifications(prev => prev.map(n => n.id === notification.id ? {...n, read_at: null} : n))
        }
    }

    const markAllAsRead = async () => {
        const before = notifications

        try {
            const now = new Date().toISOString()
            setNotifications(prev => prev.map(n => !n.read_at ? {...n, read_at: now} : n))
            await api.post(`/notifications/read-all`)
        } catch (e) {
            console.error(e)
            setNotifications(before)
        }
    }

    return (
        <NotificationContext value={{
            notifications,
            unreadCount,
            loading,
            error,
            markAsRead,
            markAllAsRead
        }}>
            {children}
        </NotificationContext>
    )
}

export const useNotifications = () => useContext(NotificationContext)
