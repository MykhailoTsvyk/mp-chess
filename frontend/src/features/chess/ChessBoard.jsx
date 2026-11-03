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
    const legalMoves = myColor === game.turn() && selectedSquare ? game.moves({ square: selectedSquare.coordinate, verbose: true }) : []
    const validMoves = legalMoves.map(m => m.to)

    // {from, to} while the player picks a piece for a pawn reaching the last rank
    const [pendingPromotion, setPendingPromotion] = useState(null)

    function sendMove(from, to, promotion) {
        socket.emit("game:move", gameData.game.id, from, to, promotion)
    }

    function handleMove(from, to) {
        const isPromotion = legalMoves.some(m => m.to === to && m.promotion)

        if (isPromotion) {
            setPendingPromotion({from, to})
        } else {
            sendMove(from, to)
        }

        setSelectedSquare('')
    }

    function handlePromotionSelect(piece) {
        sendMove(pendingPromotion.from, pendingPromotion.to, piece)
        setPendingPromotion(null)
    }

    // black sees the board from their side by default; the flip button toggles it
    const [flipToggled, setFlipToggled] = useState(false)
    const isFlipped = (myColor === "b") !== flipToggled

    return (
            <div className="w-full max-w-[560px] lg:max-w-[640px] xl:max-w-[720px] mx-auto">
                {/* ${isFlipped ? "flex-row-reverse" : ""}*/}
                <div className={`relative flex flex-col ${isFlipped ? "flex-col-reverse" : ""}`}>
                    <div className="flex items-center gap-2 border border-ui-border bg-ui-surface px-3 py-2 text-ui-primary">
                        <PlayerCard user={gameData?.blackPlayer} />
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
                                                        isLight={(rowIndex + colIndex) % 2 === 0}
                                                        coordinate={`${col + (rowIndex + 1)}`}
                                                        rankLabel={isLeftColumn ? rowIndex + 1 : null}
                                                        fileLabel={isBottomRow ? col : null}
                                                        piece={piece ? piece : null}
                                                        selectedSquare={selectedSquare}
                                                        setSelectedSquare={setSelectedSquare}
                                                        validMoves={validMoves}
                                                        onMove={handleMove}
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
                    </div>

                </div>

                {/* Game controls */}
                <GameControls onFlip={() => setFlipToggled(!flipToggled)}/>

            </div>
    )
}