import {Link} from "react-router";

export const GAME_ROW_GRID = "grid grid-cols-[1fr_3.5rem_3rem_6rem] sm:grid-cols-[4.5rem_1fr_4.5rem_4rem_7rem] items-center gap-x-3 sm:gap-x-4"

const RESULT_STYLES = {
    win: {label: "W", title: "Win", className: "bg-green-500/15 text-green-500"},
    loss: {label: "L", title: "Loss", className: "bg-red-500/15 text-red-500"},
    draw: {label: "D", title: "Draw", className: "bg-ui-interactive text-ui-secondary"}
}

const CATEGORY_LABELS = {bullet: "Bullet", blitz: "Blitz", rapid: "Rapid"}

function formatTimeControl({initial, increment}) {
    return `${Math.round(initial / 60)}+${increment}`
}

function formatDate(endedAt) {
    if (!endedAt) return "—"
    return new Date(endedAt).toLocaleDateString("en-GB", {day: "numeric", month: "short", year: "numeric"})
}

function formatChange(change) {
    return `${change > 0 ? "+" : ""}${change}`
}

function changeClass(change) {
    if (change > 0) return "text-green-500"
    if (change < 0) return "text-red-500"
    return "text-ui-secondary"
}

function PlayerLine({player, pieceColor, isViewedUser}) {
    const square = pieceColor === "white"
        ? "bg-white border-gray-400"
        : "bg-gray-700 border-gray-500"
    const nameClass = `truncate ${isViewedUser ? "font-bold text-ui-primary" : "text-ui-primary"}`

    return (
        <div className="flex items-center gap-2 min-w-0">
            <span className={`w-3 h-3 shrink-0 rounded-sm border ${square}`} title={pieceColor}/>
            {player.id ? (
                <Link to={`/profile/${player.id}`} className={`${nameClass} hover:text-ui-accent`}>
                    {player.username}
                </Link>
            ) : (
                <span className={`${nameClass} italic text-ui-secondary`}>Deleted user</span>
            )}
            {player.rating != null && (
                <span className="text-xs text-ui-secondary shrink-0">({player.rating})</span>
            )}
            {player.change != null && (
                <span className={`text-xs font-semibold shrink-0 ${changeClass(player.change)}`}>
                    {formatChange(player.change)}
                </span>
            )}
        </div>
    )
}

export default function GameCard({ game }) {
    const result = RESULT_STYLES[game.result]

    return (
        <div className={`${GAME_ROW_GRID} px-4 py-3 border-b border-ui-border last:border-b-0 even:bg-ui-main transition-colors hover:bg-ui-interactive cursor-pointer`}>
            <div className="hidden sm:flex flex-col items-center text-xs text-ui-secondary leading-tight">
                <span className="font-semibold text-ui-primary">{formatTimeControl(game.time_control)}</span>
                {game.rating_category && <span>{CATEGORY_LABELS[game.rating_category]}</span>}
            </div>

            <div className="flex flex-col gap-1 min-w-0">
                <PlayerLine player={game.white} pieceColor="white" isViewedUser={game.color === "white"}/>
                <PlayerLine player={game.black} pieceColor="black" isViewedUser={game.color === "black"}/>
            </div>

            <span
                className={`w-8 h-8 justify-self-center flex items-center justify-center rounded-md text-sm font-bold ${result.className}`}
                title={result.title}
            >
                {result.label}
            </span>

            <span className="text-sm text-ui-primary text-center">{game.moves}</span>

            <span className="text-sm text-ui-secondary text-center whitespace-nowrap">{formatDate(game.ended_at)}</span>
        </div>
    )
}
