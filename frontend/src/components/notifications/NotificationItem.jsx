import {useNotifications} from "../../context/NotificationContext.jsx"

// lookup table with how each notification type is shown, keys match backend/config/notificationTypes.js
const NOTIFICATION_DISPLAY = {
    friend_request: {
        text: (data) => <><b>{data.fromUsername}</b> sent you a friend request</>,
        link: (data) => `/profile/${data.fromUserID}`,
        hasActions: true
    },
    friend_accepted: {
        text: (data) => <><b>{data.fromUsername}</b> accepted your friend request</>,
        link: (data) => `/profile/${data.fromUserID}`
    },
    game_challenge: {
        text: (data) => <><b>{data.fromUsername}</b> challenged you to a {data.timeControl} game</>,
        link: () => "/",
        hasActions: true
    },
}
// other type from already defined
const FALLBACK_DISPLAY = {text: () => "New notification", link: () => null}

const relativeTime = new Intl.RelativeTimeFormat("en", {numeric: "auto"})

function formatTime(createdAt) {
    const seconds = Math.round((new Date(createdAt) - Date.now()) / 1000)
    const units = [["day", 86400], ["hour", 3600], ["minute", 60]]

    for (const [unit, size] of units) {
        if (Math.abs(seconds) >= size) {
            return relativeTime.format(Math.round(seconds / size), unit)
        }
    }
    return "just now"
}

export default function NotificationItem({notification, onOpen}) {
    const display = NOTIFICATION_DISPLAY[notification.type] ?? FALLBACK_DISPLAY
    const isUnread = !notification.read_at
    const initial = notification.data?.fromUsername?.[0] ?? "?"
    const {markAsRead} = useNotifications()
    

    function open() {
        markAsRead(notification)
        onOpen(display.link(notification.data))
    }

    function handleKeyDown(e) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            open()
        }
    }

    return (
        <li
            role="button"
            tabIndex={0}
            onClick={open}
            onKeyDown={handleKeyDown}
            className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-ui-interactive focus:outline-none focus-visible:bg-ui-interactive ${
                isUnread ? "bg-ui-main" : ""
            }`}
        >
            <div className="w-9 h-9 shrink-0 rounded-full bg-ui-accent text-ui-contrast flex items-center justify-center font-bold uppercase text-sm">
                {initial}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm text-ui-primary leading-snug">
                    {display.text(notification.data)}
                </p>
                <p className="text-xs text-ui-secondary mt-0.5">{formatTime(notification.created_at)}</p>

                {display.hasActions && (
                    <div className="flex gap-2 mt-2">
                        {/* TODO: call the feature's endpoint (e.g. accept the friendship) */}
                        <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1 rounded-md bg-ui-accent text-ui-contrast text-xs font-semibold hover:opacity-90 cursor-pointer"
                        >
                            Accept
                        </button>
                        <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1 rounded-md border border-ui-border text-ui-secondary text-xs font-semibold hover:text-ui-primary hover:bg-ui-surface cursor-pointer"
                        >
                            Decline
                        </button>
                    </div>
                )}
            </div>

            {isUnread && (
                <span className="w-2 h-2 mt-1.5 shrink-0 rounded-full bg-ui-accent">
                    <span className="sr-only">Unread</span>
                </span>
            )}
        </li>
    )
}
