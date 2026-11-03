import {useEffect} from "react";
import {useChess} from "../../context/ChessContext.jsx";
import {useNavigate} from "react-router";
import {pieceImages} from "./pieceImages.js";

const drawReasonLabels = {
    stalemate: "by stalemate",
    insufficient_material: "by insufficient material",
    threefold_repetition: "by threefold repetition",
    fifty_move_rule: "by the 50-move rule",
    agreement: "by agreement"
}

// one side of the score row: player name, colour and their points
function PlayerResult({player, color, points, isWinner}) {
    return (
        <div className="flex min-w-0 flex-col items-center gap-2">
            {/* always light, like the board's light squares, so the black pawn stays visible in dark mode */}
            <div className="flex h-[75px] w-[75px] items-center justify-center rounded-md border-2 border-slate-400 bg-slate-200 p-1.5">
                <img src={pieceImages[`${color}p`]} alt={color === "w" ? "White" : "Black"} className="h-full w-full object-contain"/>
            </div>
            <span className={`max-w-full truncate text-sm font-semibold ${isWinner ? "text-ui-accent" : "text-ui-primary"}`}>
                {player?.username || "Player"}
            </span>
            <span className="text-lg font-bold leading-none text-ui-primary">{points}</span>
        </div>
    )
}

export default function SummaryWindow({setIsClosed}) {
    const {gameData} = useChess()
    const navigate = useNavigate()

    const game = gameData?.game
    const whitePlayer = gameData?.whitePlayer
    const blackPlayer = gameData?.blackPlayer
    const winnerID = game?.winner_id

    const isAborted = game?.status === "aborted"
    const isWhiteWinner = winnerID != null && winnerID === whitePlayer?.id
    const isBlackWinner = winnerID != null && winnerID === blackPlayer?.id

    let title = "Draw"
    let subtitle = drawReasonLabels[game?.draw_reason] ? `Draw ${drawReasonLabels[game.draw_reason]}` : "The game ended in a draw"
    let whitePoints = "½"
    let blackPoints = "½"

    if (isAborted) {
        title = "Game aborted"
        subtitle = "No moves were made, so the game doesn't count"
        whitePoints = "–"
        blackPoints = "–"
    } else if (isWhiteWinner || isBlackWinner) {
        title = `${(isWhiteWinner ? whitePlayer : blackPlayer)?.username || "Player"} won`
        subtitle = isWhiteWinner ? "White wins" : "Black wins"
        whitePoints = isWhiteWinner ? "1" : "0"
        blackPoints = isBlackWinner ? "1" : "0"
    }

    function close() {
        setIsClosed(true)
    }

    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === "Escape") setIsClosed(true)
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [setIsClosed])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
             onClick={close}
        >
            <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-ui-border bg-ui-surface shadow-2xl shadow-black/30"
                 onClick={(e) => e.stopPropagation()}
                 role="dialog"
                 aria-modal="true"
                 aria-labelledby="summary-title"
            >
                {/* Close */}
                <button onClick={close}
                        className="absolute right-3 top-3 rounded-md p-1.5 text-ui-secondary transition-colors hover:bg-ui-interactive hover:text-ui-primary cursor-pointer"
                        aria-label="Close"
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Result */}
                <div className="px-6 pb-6 pt-8 text-center">
                    <p className="text-xs font-semibold uppercase tracking-widest text-ui-secondary">Game over</p>
                    <h1 id="summary-title" className="mt-2 text-2xl font-bold tracking-tight text-ui-primary">
                        {title}
                    </h1>
                    <p className="mt-1 text-sm text-ui-secondary">{subtitle}</p>
                </div>

                {/* Score */}
                <div className="mx-6 mb-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <PlayerResult player={whitePlayer} color="w" points={whitePoints} isWinner={isWhiteWinner}/>
                    <span className="text-lg font-semibold text-ui-secondary">–</span>
                    <PlayerResult player={blackPlayer} color="b" points={blackPoints} isWinner={isBlackWinner}/>
                </div>

                {/* Actions */}
                <div className="flex gap-3 border-t border-ui-border bg-ui-main/50 p-4">
                    <button onClick={close}
                            className="flex-1 rounded-lg border border-ui-border bg-ui-surface px-4 py-2.5 text-sm font-semibold text-ui-primary transition-colors hover:bg-ui-interactive cursor-pointer"
                    >
                        View board
                    </button>
                    <button onClick={() => navigate("/")}
                            className="flex-1 rounded-lg bg-ui-accent px-4 py-2.5 text-sm font-semibold text-ui-contrast shadow-sm transition-opacity hover:opacity-90 active:scale-[0.98] cursor-pointer"
                    >
                        Back to home
                    </button>
                </div>
            </div>
        </div>
    )
}
