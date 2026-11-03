import {useEffect} from "react";
import {pieceImages} from "./pieceImages.js"

// pieces a pawn can promote to, in chess.js notation
const promotionPieces = [
    {type: "q", name: "Queen"},
    {type: "r", name: "Rook"},
    {type: "b", name: "Bishop"},
    {type: "n", name: "Knight"},
]

// overlay over the board; clicking outside the boxes or pressing Esc cancels the move
export default function PromotionPicker({color, onSelect, onCancel}) {
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === "Escape") onCancel()
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [onCancel])

    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm"
             onClick={onCancel}
        >
            <div className="flex flex-col items-center gap-3 rounded-xl border border-ui-border bg-ui-surface p-4 shadow-xl"
                 onClick={(e) => e.stopPropagation()}
            >
                <p className="text-sm font-semibold text-ui-primary">Promote pawn to</p>

                <div className="grid grid-cols-4 gap-2">
                    {promotionPieces.map(({type, name}) => (
                        <button key={type}
                                className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-md border border-ui-border bg-ui-main p-2 transition-all hover:border-ui-accent hover:bg-ui-interactive cursor-pointer"
                                onClick={() => onSelect(type)}
                                aria-label={name}
                                title={name}
                        >
                            <img src={pieceImages[`${color}${type}`]} alt="" className="h-full w-full object-contain pointer-events-none"/>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
