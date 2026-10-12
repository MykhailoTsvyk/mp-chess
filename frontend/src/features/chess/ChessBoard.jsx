import captureSound from "../../assets/sounds/capture.mp3"
import castleSound from "../../assets/sounds/castle.mp3"
import notifySound from "../../assets/sounds/notify.mp3"
import moveSound from "../../assets/sounds/move-self.mp3"
import {useEffect, useState} from "react"
import {Chess} from "chess.js"
import Square from "./Square.jsx"
import PlayerCard from "./PlayerCard.jsx"
import flipIconBlack from "../../assets/images/icons/flipIconBlack.svg"
import flipIconWhite from "../../assets/images/icons/flipIcon.svg"
import {useSocket} from "../../context/SocketContext.jsx";
import {useChess} from "../../context/ChessContext.jsx";
import {useAuth} from "../../context/AuthContext.jsx";

const sounds = {
    capture: new Audio(captureSound),
    move: new Audio(moveSound),
    notify: new Audio(notifySound),
    castle: new Audio(castleSound)
}

export default function ChessBoard(){
    const {socket} = useSocket()
    const {user} = useAuth()
    const columns = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    const [game, setGame] = useState(() => new Chess())
    const {gameData, setGameData} = useChess()
    const myColor = gameData.blackPlayer?.id === user.id ? "b" : "w"
    const [selectedSquare, setSelectedSquare] = useState('')
    const validMoves = myColor === game.turn() && selectedSquare ? game.moves({ square: selectedSquare.coordinate, verbose: true }).map(m => m.to) : []

    const [isFlipped, setIsFlipped] = useState(myColor !== "w") // false if start as white, true if start as black

    useEffect(() => {
        function handleUpdate(data){
            console.log("new fen", data)
            setGame(new Chess(data.game.fen))
            setGameData(data)
        }

        socket.on("game:updated",(data) => handleUpdate(data))

    }, [gameData]);

    return (
            <div className="w-full max-w-[560px] lg:max-w-[640px] xl:max-w-[720px] mx-auto">
                <button
                    className="flex items-center justify-center rounded-md bg-ui-main p-2 text-ui-primary transition-opacity hover:opacity-80"
                    onClick={() => setIsFlipped(!isFlipped)}
                    aria-label="Flip board"
                >
                    <img src={localStorage.getItem("theme") === "dark" ? flipIconWhite : flipIconBlack} alt="" className="h-4 w-4 sm:h-5 sm:w-5 object-contain"/>
                </button>
                {/* ${isFlipped ? "flex-row-reverse" : ""}*/}
                <div className={`relative flex flex-col ${isFlipped ? "flex-col-reverse" : ""}`}>
                    <div className="flex items-center gap-2 border border-ui-border bg-ui-surface px-3 py-2 text-ui-primary">
                        <PlayerCard user={gameData.whitePlayer} />
                    </div>
                    <div className={`flex ${isFlipped ? "flex-col" : "flex-col-reverse"}`}>
                        {
                            [...Array(8)].map((row, rowIndex) => (
                                <div className={`flex`}>
                                    {
                                        columns.map((col, colIndex) => {
                                            const piece = game.board().reverse()[rowIndex][colIndex]

                                            return (
                                                <Square isLight={(rowIndex + colIndex) % 2 === 0}
                                                        coordinate={`${col + (rowIndex + 1)}`}
                                                        piece={piece ? piece : null}
                                                        selectedSquare={selectedSquare}
                                                        setSelectedSquare={setSelectedSquare}
                                                        validMoves={validMoves}
                                                        roomID={gameData.game.id}
                                                />
                                            )

                                        })
                                    }
                                </div>
                            ))
                        }
                    </div>
                    <div className="flex items-center gap-2 border border-ui-border bg-ui-surface px-3 py-2 text-ui-primary">
                        <PlayerCard user={gameData.blackPlayer} />
                    </div>

                </div>
            </div>
    )
}