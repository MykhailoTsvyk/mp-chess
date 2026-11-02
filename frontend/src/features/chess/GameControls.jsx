import {useEffect, useState} from "react";
import flipIconBlack from "../../assets/images/icons/flipIconBlack.svg"
import flipIconWhite from "../../assets/images/icons/flipIcon.svg"
import {useChess} from "../../context/ChessContext.jsx";
import {useAuth} from "../../context/AuthContext.jsx";
import {useSocket} from "../../context/SocketContext.jsx";

const buttonClass = "flex items-center justify-center rounded-md bg-ui-main px-3 py-2 text-sm font-medium text-ui-primary transition-opacity hover:opacity-80 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"

// seconds left until the server's leave timeout ends the game
function LeaveCountdown({username, deadline, noMovesYet}) {
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(interval)
    }, [])

    const secondsLeft = Math.max(0, Math.ceil((deadline - now) / 1000))

    return (
        <p className="w-full text-sm text-rose-500">
            {username} left the game. {noMovesYet ? "The game will be aborted" : "They lose"} in {secondsLeft}s unless they return.
        </p>
    )
}

export default function GameControls({onFlip}) {
    const {user} = useAuth()
    const {socket} = useSocket()
    const {gameData, isGameOver} = useChess()
    const [isConfirmingResign, setIsConfirmingResign] = useState(false)

    const gameID = gameData?.game?.id
    const isPlayer = gameData?.whitePlayer?.id === user.id || gameData?.blackPlayer?.id === user.id
    const canAct = isPlayer && !isGameOver

    const drawOffer = gameData?.drawOffer
    const isOfferFromOpponent = drawOffer && drawOffer.from !== user.id
    const isOfferFromMe = drawOffer?.from === user.id
    const isDrawBlocked = gameData?.drawBlocked?.includes(user.id)

    const players = [gameData?.whitePlayer, gameData?.blackPlayer].filter(Boolean)
    const leftPlayers = players.filter(p => gameData?.leftPlayers?.[p.id])
    const noMovesYet = !gameData?.game?.moves?.length

    function handleResign() {
        socket.emit("game:resign", gameID)
        setIsConfirmingResign(false)
    }

    return (
        <div className="flex flex-wrap items-center gap-2 py-2">
            {/* Flip board */}
            <button
                className={buttonClass}
                onClick={onFlip}
                aria-label="Flip board"
            >
                <img src={localStorage.getItem("theme") === "dark" ? flipIconWhite : flipIconBlack} alt="" className="h-4 w-4 sm:h-5 sm:w-5 object-contain"/>
            </button>

            {canAct && (
                <>
                    {/* Draw by agreement */}
                    {isOfferFromOpponent ? (
                        <>
                            <span className="text-sm text-ui-secondary">Opponent offers a draw</span>
                            <button className={buttonClass} onClick={() => socket.emit("game:respond-draw", gameID, true)}>
                                Accept
                            </button>
                            <button className={buttonClass} onClick={() => socket.emit("game:respond-draw", gameID, false)}>
                                Decline
                            </button>
                        </>
                    ) : (
                        <button
                            className={buttonClass}
                            onClick={() => socket.emit("game:offer-draw", gameID)}
                            disabled={isOfferFromMe || isDrawBlocked}
                            title={isDrawBlocked ? "You can offer a draw again after your next move" : undefined}
                        >
                            {isOfferFromMe ? "Draw offered" : "Offer draw"}
                        </button>
                    )}

                    {/* Resign, with a confirmation step */}
                    {isConfirmingResign ? (
                        <>
                            <span className="text-sm text-ui-secondary">Resign?</span>
                            <button className={`${buttonClass} text-rose-500`} onClick={handleResign}>
                                Yes
                            </button>
                            <button className={buttonClass} onClick={() => setIsConfirmingResign(false)}>
                                No
                            </button>
                        </>
                    ) : (
                        <button className={buttonClass} onClick={() => setIsConfirmingResign(true)}>
                            Resign
                        </button>
                    )}
                </>
            )}

            {!isGameOver && leftPlayers.map(p => (
                <LeaveCountdown key={p.id}
                                username={p.username}
                                deadline={gameData.leftPlayers[p.id]}
                                noMovesYet={noMovesYet}
                />
            ))}
        </div>
    )
}
