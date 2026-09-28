import {useEffect, useState} from "react";
import {useSocket} from "../context/SocketContext.jsx";
import {useNavigate} from "react-router";

export default function MatchmakingWindow({cancelMatchmaking}) {
    const {socket, isConnected} = useSocket()
    const [matchmakingData, setmatchmakingData] = useState('')
    const [isCancelled, setIsCancelled] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (!socket || !isConnected) return

        socket.emit("matchmaking:start")

        const handleQueued = (data) => setmatchmakingData(data);
        const handleCancelled = () => setIsCancelled(true);

        socket.on("matchmaking:queued", (data) => {
            setmatchmakingData(data)
        })

        socket.on("matchmaking:matchFound", (data) => {
            navigate(data.gameRoomID)
        })

        socket.on("matchmaking:cancelled", () => setIsCancelled(true))

        // clean up to tell server stop matchmaking process
        return () => {
            socket.off("matchmaking:queued", handleQueued);
            socket.off("matchmaking:cancelled", handleCancelled);

            socket.emit("matchmaking:cancel")
        }
    }, [socket, isConnected]);

    return (
        <div className="fixed inset-0 z-99 flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"

            />

            <div className="relative z-10 flex w-full max-w-md flex-col items-center rounded-2xl border border-ui-border bg-ui-surface p-8 text-center shadow-xl transition-all">
                {!isCancelled && (
                    <>
                        <h1 className="text-2xl font-bold tracking-tight text-ui-primary">
                            Matchmaking
                        </h1>

                        {matchmakingData && (<p className="mt-2 text-sm text-ui-secondary">{matchmakingData.status}</p>)}

                        <p className="mt-2 text-sm text-ui-secondary">
                            Players in the queue: <span className="text-ui-accent font-bold">{matchmakingData.totalPlayers}</span>
                        </p>

                        <div className="mt-8 flex items-center justify-center">
                            <div className="h-16 w-16 animate-spin rounded-full border-4 border-ui-interactive border-t-ui-accent" />
                        </div>

                        <button className="mt-8 w-full rounded-xl border border-ui-border bg-ui-interactive px-4 py-3 text-sm font-semibold text-ui-primary transition-all hover:border-ui-accent hover:text-ui-accent active:scale-[0.98]"
                                onClick={() => cancelMatchmaking(false)}
                        >
                            Cancel Search
                        </button>
                    </>
                )}

                {isCancelled && (
                    <>
                        <h1>Matchmaking cancelled</h1>
                        <p>Reason: Matchmaking started on another device.</p>
                        <button className="mt-8 w-full rounded-xl border border-ui-border bg-ui-interactive px-4 py-3 text-sm font-semibold text-ui-primary transition-all hover:border-ui-accent hover:text-ui-accent active:scale-[0.98]"
                                onClick={() => cancelMatchmaking(false)}
                        >
                            Close Window
                        </button>
                    </>
                )}

            </div>

        </div>
    )
}