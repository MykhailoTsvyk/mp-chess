import { createContext, useContext, useEffect, useState } from "react"
import { useSocket } from "./SocketContext.jsx"
import api from "../api/axios.js"

const ChessContext = createContext()

const FINISHED_STATUSES = ["finished", "draw", "aborted"]

export default function ChessProvider({ children }) {
    const [gameID, setGameID] = useState(null)
    const { socket } = useSocket()
    const [gameData, setGameData] = useState(null)
    const [isReadOnly, setIsReadOnly] = useState(false)

    const [loadedGameID, setLoadedGameID] = useState(gameID)

    // clear the previous game while the new one loads
    if (gameID !== loadedGameID) {
        setLoadedGameID(gameID)
        setGameData(null)
        setIsReadOnly(false)
    }

    const isGameOver = FINISHED_STATUSES.includes(gameData?.game?.status)

    useEffect(() => {
        if (!gameID || gameID === "undefined") return

        // set when the player opens another game (or leaves) before this reply arrives
        let isStale = false

        async function fetchGame() {
            try {
                const res = await api.get(`/game/${gameID}`)
                if (isStale) return

                setIsReadOnly(FINISHED_STATUSES.includes(res.data.game.status))

                // the DB only has the starting position and times of a live game (it's saved
                // when the game ends), so it must not replace live socket data that arrived first
                setGameData(prev => prev?.clock ? prev : res.data)
            } catch (e) {
                console.error("Failed to fetch game:", e)
            }
        }

        fetchGame()

        return () => {
            isStale = true
        }
    }, [gameID])

    useEffect(() => {
        if (!gameID || gameID === "undefined" || isReadOnly) return
        if (!socket) return

        function requestSync() {
            socket.emit("game:sync-state", gameID)
        }

        function onGameUpdated(serverData) {
            // clocks count down locally from the moment this update arrived
            setGameData({...serverData, receivedAt: performance.now()})
        }

        requestSync()

        // named handlers so cleanup doesn't remove other components' listeners
        socket.on("connect", requestSync)
        socket.on("game:updated", onGameUpdated)

        return () => {
            socket.off("connect", requestSync)
            socket.off("game:updated", onGameUpdated)

            // leaving the game page starts the server's leave timeout for players
            socket.emit("game:leave", gameID)
        }
    }, [socket, gameID, isReadOnly])

    return (
        <ChessContext.Provider value={{ gameData, setGameID, isGameOver, isReadOnly }}>
            {children}
        </ChessContext.Provider>
    )
}

export const useChess = () => useContext(ChessContext)
