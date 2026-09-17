import {useEffect} from "react";
import {useSocket} from "../context/SocketContext.jsx";

export default function MatchmakingWindow({cancelMatchmaking}) {
    const {socket, isConnected} = useSocket()

    useEffect(() => {
        if (!socket || !isConnected) return

        socket.emit("matchmaking:start")

        // clean up to tell server stop matchmaking process
        return () => {
            socket.emit("matchmaking:cancel")
        }
    }, [socket, isConnected]);

    return (
        <div className="fixed inset-0 z-99 flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"

            />

            <div className="relative z-10 flex w-full max-w-md flex-col items-center rounded-2xl border border-ui-border bg-ui-surface p-8 text-center shadow-xl transition-all">
                <h1 className="text-2xl font-bold tracking-tight text-ui-primary">
                    Matchmaking
                </h1>

                <p className="mt-2 text-sm text-ui-secondary">
                    Looking for an opponent for you...
                </p>

                <p className="mt-2 text-sm text-ui-secondary">
                    Other players in the queue: <span className="text-ui-accent font-bold">1</span>
                </p>

                <div className="mt-8 flex items-center justify-center">
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-ui-interactive border-t-ui-accent" />
                </div>

                <button className="mt-8 w-full rounded-xl border border-ui-border bg-ui-interactive px-4 py-3 text-sm font-semibold text-ui-primary transition-all hover:border-ui-accent hover:text-ui-accent active:scale-[0.98]"
                        onClick={() => cancelMatchmaking(false)}
                >
                    Cancel Search
                </button>
            </div>

        </div>
    )
}