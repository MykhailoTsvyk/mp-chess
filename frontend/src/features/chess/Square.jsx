import {useEffect, useRef} from "react"
import {useDrag, useDrop} from "react-dnd"
import {getEmptyImage} from "react-dnd-html5-backend"
import {pieceImages} from "./pieceImages.js"
import {PIECE} from "./dragTypes.js"

// moveHint: "move" draws a dot, "capture" a ring around the piece, null nothing
export default function Square({isLight, piece= null, coordinate, selectedSquare, setSelectedSquare, validMoves, moveHint = null, onMove,
                                   canDrag = false, onDragStart, onDragCancel, onDrop, rankLabel = null, fileLabel = null}) {
    const bgClass = isLight ? "bg-slate-200" : "bg-indigo-600";
    // coordinates use the opposite square colour so they stay readable
    const labelClass = `pointer-events-none absolute text-xs sm:text-sm lg:text-base font-bold leading-none ${isLight ? "text-indigo-600" : "text-slate-200"}`
    const squareRef = useRef(null)

    const [{isDragging}, dragRef, previewRef] = useDrag(() => ({
        type: PIECE,
        // called when the drag starts; the size lets the drag layer draw the piece at board scale
        item: () => {
            onDragStart(coordinate, piece)
            return {from: coordinate, piece, size: squareRef.current?.offsetWidth}
        },
        canDrag: () => canDrag,
        // dropped outside the board
        end: (item, monitor) => {
            if (!monitor.didDrop()) onDragCancel()
        },
        collect: (monitor) => ({isDragging: monitor.isDragging()}),
    }), [coordinate, piece, canDrag, onDragStart, onDragCancel])

    const [, dropRef] = useDrop(() => ({
        accept: PIECE,
        drop: (item) => onDrop(item.from, coordinate),
    }), [coordinate, onDrop])

    // the drag layer draws the piece, so the browser's semi-transparent copy is hidden
    useEffect(() => {
        previewRef(getEmptyImage(), {captureDraggingState: true})
    }, [previewRef])

    function attachRefs(node) {
        squareRef.current = node
        dragRef(dropRef(node))
    }

    function handleSelectedSquare() {
        if (validMoves.includes(coordinate)) {
            onMove(selectedSquare.coordinate, coordinate)
        } else {
            setSelectedSquare(piece ? { piece, coordinate } : { coordinate })
        }

    }

    return (
        <div
            ref={attachRefs}
            data-square={coordinate}
            // touch-none stops the page from scrolling while a piece is dragged on a phone
            data-move-hint={moveHint ?? undefined}
            className={`${bgClass} relative flex aspect-square w-full items-center justify-center p-1 select-none ${canDrag ? "cursor-grab touch-none" : ""}`}
            onClick={handleSelectedSquare}
        >
            {rankLabel && <span className={`${labelClass} top-0.5 left-1`}>{rankLabel}</span>}
            {fileLabel && <span className={`${labelClass} bottom-0.5 right-1`}>{fileLabel}</span>}

            {/* the square looks empty while its piece is being dragged */}
            {piece && !isDragging && (
                <img
                    src={pieceImages[`${piece.color}${piece.type}`]}
                    alt={`${piece.color} ${piece.type}`}
                    className="h-full w-full object-contain pointer-events-none"
                />
            )}

            {moveHint === "move" && (
                <span className="pointer-events-none absolute h-[30%] w-[30%] rounded-full bg-emerald-500/70"/>
            )}
            {moveHint === "capture" && (
                <span className="pointer-events-none absolute inset-0.5 rounded-full border-4 sm:border-[6px] border-emerald-500/70"/>
            )}
        </div>
    )
}
