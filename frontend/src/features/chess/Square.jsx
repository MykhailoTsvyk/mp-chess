import {pieceImages} from "./pieceImages.js"

export default function Square({isLight, piece= null, coordinate, selectedSquare, setSelectedSquare, validMoves, onMove}) {
    const bgClass = isLight ? "bg-slate-200" : "bg-indigo-600";

    function handleSelectedSquare() {
        if (validMoves.includes(coordinate)) {
            onMove(selectedSquare.coordinate, coordinate)
        } else {
            setSelectedSquare(piece ? { piece, coordinate } : { coordinate })
        }

    }

    return (
        <div
            className={`${bgClass} flex aspect-square w-full items-center justify-center p-1 select-none ${validMoves.includes(coordinate) ? "ring-4 ring-inset ring-emerald-500/70" : "" }`}
            onClick={handleSelectedSquare}
        >
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
