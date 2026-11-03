import {pieceImages} from "./pieceImages.js"

export default function Square({isLight, piece= null, coordinate, selectedSquare, setSelectedSquare, validMoves, onMove, rankLabel = null, fileLabel = null}) {
    const bgClass = isLight ? "bg-slate-200" : "bg-indigo-600";
    // coordinates use the opposite square colour so they stay readable
    const labelClass = `pointer-events-none absolute text-xs sm:text-sm lg:text-base font-bold leading-none ${isLight ? "text-indigo-600" : "text-slate-200"}`

    function handleSelectedSquare() {
        if (validMoves.includes(coordinate)) {
            onMove(selectedSquare.coordinate, coordinate)
        } else {
            setSelectedSquare(piece ? { piece, coordinate } : { coordinate })
        }

    }

    return (
        <div
            className={`${bgClass} relative flex aspect-square w-full items-center justify-center p-1 select-none ${validMoves.includes(coordinate) ? "ring-4 ring-inset ring-emerald-500/70" : "" }`}
            onClick={handleSelectedSquare}
        >
            {rankLabel && <span className={`${labelClass} top-0.5 left-1`}>{rankLabel}</span>}
            {fileLabel && <span className={`${labelClass} bottom-0.5 right-1`}>{fileLabel}</span>}

            {piece && (
                <img
                    src={pieceImages[`${piece.color}${piece.type}`]}
                    alt={`${piece.color} ${piece.type}`}
                    className="h-full w-full object-contain pointer-events-none"
                />
            )}
        </div>
    )
}
