import captureSound from "../../assets/sounds/capture.mp3"
import castleSound from "../../assets/sounds/castle.mp3"
import notifySound from "../../assets/sounds/notify.mp3"
import moveSound from "../../assets/sounds/move-self.mp3"
import {useState} from "react"
import {Chess} from "chess.js"
import Square from "./Square.jsx"
import PlayerCard from "./PlayerCard.jsx"
import GameControls from "./GameControls.jsx"
import {useChess} from "../../context/ChessContext.jsx";
import {useAuth} from "../../context/AuthContext.jsx";

const sounds = {
    capture: new Audio(captureSound),
    move: new Audio(moveSound),
    notify: new Audio(notifySound),
    castle: new Audio(castleSound)
}

export default function ChessBoard(){
    const {user} = useAuth()
    const columns = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    const {gameData} = useChess()
    const game = new Chess(gameData?.game?.fen)
    const board = game.board().reverse() // rank 1 first

    // null for spectators
    let myColor = null
    if (gameData?.whitePlayer?.id === user.id) myColor = "w"
    if (gameData?.blackPlayer?.id === user.id) myColor = "b"

    const [selectedSquare, setSelectedSquare] = useState('')
    const validMoves = myColor === game.turn() && selectedSquare ? game.moves({ square: selectedSquare.coordinate, verbose: true }).map(m => m.to) : []

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
                    <div className={`flex ${isFlipped ? "flex-col" : "flex-col-reverse"}`}>
                        {
                            [...Array(8)].map((row, rowIndex) => (
                                <div className={`flex`} key={rowIndex}>
                                    {
                                        columns.map((col, colIndex) => {
                                            const piece = board[rowIndex][colIndex]

                                            return (
                                                <Square key={col}
                                                        isLight={(rowIndex + colIndex) % 2 === 0}
                                                        coordinate={`${col + (rowIndex + 1)}`}
                                                        piece={piece ? piece : null}
                                                        selectedSquare={selectedSquare}
                                                        setSelectedSquare={setSelectedSquare}
                                                        validMoves={validMoves}
                                                        roomID={gameData?.game?.id}
                                                />
                                            )

                                        })
                                    }
                                </div>
                            ))
                        }
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