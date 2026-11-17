import {useNavigate} from "react-router";
import NotificationItem from "./NotificationItem.jsx";
import {useNotifications} from "../../context/NotificationContext.jsx";

export default function NotificationDropdown({onClose}) {
    const {notifications, unreadCount, loading, error, markAllAsRead} = useNotifications()
    const navigate = useNavigate()

    function openNotification(link) {
        onClose()
        if (link) navigate(link)
    }

    let content
    if (loading) {
        content = <p className="text-ui-secondary text-sm text-center py-8">Loading...</p>
    } else if (error) {
        content = <p className="text-rose-500 text-sm text-center py-8">{error}</p>
    } else if (notifications.length === 0) {
        content = <p className="text-ui-secondary text-sm text-center py-8">No notifications yet</p>
    } else {
        content = (
            <ul className="divide-y divide-ui-border">
                {notifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} onOpen={openNotification}/>
                ))}
            </ul>
        )
    }

    return (
        // full-width under the header on phones, a 320px panel under the bell from "sm" up
        <div
            role="dialog"
            aria-label="Notifications"
            className="fixed inset-x-2 top-14 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80
                       bg-ui-surface border border-ui-border rounded-lg shadow-xl overflow-hidden z-50"
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-ui-border">
                <h2 className="text-sm font-bold text-ui-primary">Notifications</h2>
                {unreadCount > 0 && (
                    <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-xs font-semibold text-ui-accent hover:underline cursor-pointer"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="max-h-96 overflow-y-auto">
                {content}
            </div>
        </div>
    )
}
