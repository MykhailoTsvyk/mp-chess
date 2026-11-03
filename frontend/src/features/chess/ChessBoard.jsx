import captureSound from "../../assets/sounds/capture.mp3"
import castleSound from "../../assets/sounds/castle.mp3"
import notifySound from "../../assets/sounds/notify.mp3"
import moveSound from "../../assets/sounds/move-self.mp3"
import {useState} from "react"
import {Chess} from "chess.js"
import Square from "./Square.jsx"
import PlayerCard from "./PlayerCard.jsx"
import GameControls from "./GameControls.jsx"
import PromotionPicker from "./PromotionPicker.jsx"
import PlayerClock from "./PlayerClock.jsx"
import PieceDragLayer from "./PieceDragLayer.jsx"
import {DndProvider} from "react-dnd-multi-backend"
import {HTML5toTouch} from "rdndmb-html5-to-touch"
import {useChess} from "../../context/ChessContext.jsx";
import {useAuth} from "../../context/AuthContext.jsx";
import {useSocket} from "../../context/SocketContext.jsx";

const sounds = {
    capture: new Audio(captureSound),
    move: new Audio(moveSound),
    notify: new Audio(notifySound),
    castle: new Audio(castleSound)
}

export default function ChessBoard(){
    const {user} = useAuth()
    const {socket} = useSocket()
    const columns = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    const {gameData, isGameOver} = useChess()
    const game = new Chess(gameData?.game?.fen)
    const board = game.board().reverse() // rank 1 first

    // null for spectators
    let myColor = null
    if (gameData?.whitePlayer?.id === user.id) myColor = "w"
    if (gameData?.blackPlayer?.id === user.id) myColor = "b"

    const [selectedSquare, setSelectedSquare] = useState('')
    // a finished game is read-only, even if its final position has this player to move
    const canMove = !isGameOver && myColor === game.turn()
    const movesFrom = (square) => canMove ? game.moves({ square, verbose: true }) : []
    const legalMoves = selectedSquare ? movesFrom(selectedSquare.coordinate) : []
    const validMoves = legalMoves.map(m => m.to)
    // "capture" or "move" for each target square; en passant counts as a capture although the square is empty
    const moveHints = Object.fromEntries(legalMoves.map(m => [m.to, m.captured ? "capture" : "move"]))

    // {from, to} while the player picks a piece for a pawn reaching the last rank
    const [pendingPromotion, setPendingPromotion] = useState(null)

    function sendMove(from, to, promotion) {
        socket.emit("game:move", gameData.game.id, from, to, promotion)
    }

    // shared by clicking and dropping; checked against the moves from the start square,
    // since a drop can land on any square
    function handleMove(from, to) {
        const moves = movesFrom(from).filter(m => m.to === to)

        if (moves.some(m => m.promotion)) {
            setPendingPromotion({from, to})
        } else if (moves.length > 0) {
            sendMove(from, to)
        }

        setSelectedSquare('')
    }

    // dragging selects the piece, so its moves are highlighted like after a click
    function handleDragStart(coordinate, piece) {
        setSelectedSquare({piece, coordinate})
    }

    // dropping back on the start square keeps the piece selected, like a click
    function handleDrop(from, to) {
        if (from !== to) handleMove(from, to)
    }

    function handlePromotionSelect(piece) {
        sendMove(pendingPromotion.from, pendingPromotion.to, piece)
        setPendingPromotion(null)
    }

    // black sees the board from their side by default; the flip button toggles it
    const [flipToggled, setFlipToggled] = useState(false)
    const isFlipped = (myColor === "b") !== flipToggled

    // mouse drags use the HTML5 backend; the first touch switches to the touch backend
    return (
        <DndProvider options={HTML5toTouch}>
            <div className="w-full max-w-[560px] lg:max-w-[640px] xl:max-w-[720px] mx-auto">
                {/* ${isFlipped ? "flex-row-reverse" : ""}*/}
                <div className={`relative flex flex-col ${isFlipped ? "flex-col-reverse" : ""}`}>
                    <div className="flex items-center gap-2 border border-ui-border bg-ui-surface px-3 py-2 text-ui-primary">
                        <PlayerCard user={gameData?.blackPlayer} />
                        <div className="ml-auto"><PlayerClock color="b"/></div>
                    </div>
                    <div className={`relative flex ${isFlipped ? "flex-col" : "flex-col-reverse"}`}>
                        {
                            [...Array(8)].map((row, rowIndex) => (
                                <div className={`flex`} key={rowIndex}>
                                    {
                                        // a flipped board is rotated, not mirrored: files run h -> a from the left
                                        (isFlipped ? [...columns].reverse() : columns).map((col, displayIndex) => {
                                            const colIndex = columns.indexOf(col)
                                            const piece = board[rowIndex][colIndex]

                                            // coordinates are shown on the row and column that are at the bottom / on the left on screen
                                            const isBottomRow = rowIndex === (isFlipped ? 7 : 0)
                                            const isLeftColumn = displayIndex === 0

                                            return (
                                                <Square key={col}
                                                        // indexes start at 0, so a1 is (0, 0): even sums are dark squares
                                                        isLight={(rowIndex + colIndex) % 2 === 1}
                                                        coordinate={`${col + (rowIndex + 1)}`}
                                                        rankLabel={isLeftColumn ? rowIndex + 1 : null}
                                                        fileLabel={isBottomRow ? col : null}
                                                        piece={piece ? piece : null}
                                                        selectedSquare={selectedSquare}
                                                        setSelectedSquare={setSelectedSquare}
                                                        validMoves={validMoves}
                                                        moveHint={moveHints[`${col + (rowIndex + 1)}`] ?? null}
                                                        onMove={handleMove}
                                                        canDrag={canMove && piece?.color === myColor}
                                                        onDragStart={handleDragStart}
                                                        onDragCancel={() => setSelectedSquare('')}
                                                        onDrop={handleDrop}
                                                />
                                            )

                                        })
                                    }
                                </div>
                            ))
                        }

                        {pendingPromotion && !isGameOver && (
                            <PromotionPicker color={myColor}
                                             onSelect={handlePromotionSelect}
                                             onCancel={() => setPendingPromotion(null)}
                            />
                        )}
                    </div>
                    <div className="flex items-center gap-2 border border-ui-border bg-ui-surface px-3 py-2 text-ui-primary">
                        <PlayerCard user={gameData?.whitePlayer} />
                        <div className="ml-auto"><PlayerClock color="w"/></div>
                    </div>

                </div>

                {/* Game controls */}
                <GameControls onFlip={() => setFlipToggled(!flipToggled)}/>

                <PieceDragLayer/>
            </div>
        </DndProvider>
    )
}