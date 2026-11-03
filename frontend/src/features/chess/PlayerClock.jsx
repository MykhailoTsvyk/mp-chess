import {useChess} from "../../context/ChessContext.jsx";
import {useCountdown} from "../../hooks/useCountdown.js";

const LOW_TIME_MS = 20 * 1000

// m:ss, with tenths of a second under 10 seconds
function formatClock(ms) {
    if (ms < 10 * 1000) {
        return `0:0${(Math.floor(ms / 100) / 10).toFixed(1)}`
    }

    const totalSeconds = Math.ceil(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${String(seconds).padStart(2, "0")}`
}

export default function PlayerClock({color}) {
    const {gameData, isGameOver} = useChess()
    const clock = gameData?.clock

    // live games get the clock over the socket; finished games only have the saved seconds
    const savedSeconds = color === "w" ? gameData?.game?.white_time_remaining : gameData?.game?.black_time_remaining
    const serverMs = clock ? (color === "w" ? clock.white : clock.black) : (savedSeconds != null ? savedSeconds * 1000 : null)
    const isRunning = Boolean(clock?.running && clock.turn === color && !isGameOver)

    const ms = useCountdown(serverMs, gameData?.receivedAt, isRunning)

    if (ms == null) return null

    let stateClass = "bg-ui-interactive text-ui-secondary"
    if (isRunning) {
        stateClass = ms <= LOW_TIME_MS
            ? "bg-rose-600 text-white shadow-md"
            : "bg-ui-accent text-ui-contrast shadow-md"
    }

    return (
        <div className={`min-w-[5.5rem] rounded-md px-3 py-1 text-right font-mono text-lg font-bold tabular-nums transition-colors ${stateClass}`}
             aria-label={`${color === "w" ? "White" : "Black"} clock${isRunning ? ", running" : ""}`}
        >
            {formatClock(ms)}
        </div>
    )
}
