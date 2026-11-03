import {useEffect, useState} from "react";

// counts down locally from a value the server sent; syncedAt is the performance.now()
// timestamp of when that value arrived, so each server update corrects the display
export function useCountdown(ms, syncedAt, isRunning) {
    const [now, setNow] = useState(() => performance.now())

    useEffect(() => {
        if (!isRunning) return

        const interval = setInterval(() => setNow(performance.now()), 100)
        return () => clearInterval(interval)
    }, [isRunning])

    if (ms == null) return null
    if (!isRunning || syncedAt == null) return ms

    return Math.max(0, ms - Math.max(0, now - syncedAt))
}
