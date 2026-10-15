import { createContext, useContext, useEffect, useState } from "react"
import { useSocket } from "./SocketContext.jsx"
import api from "../api/axios.js"

const ChessContext = createContext()

export default function ChessProvider({ children }) {
    const [gameID, setGameID] = useState(null)
    const { socket } = useSocket()
    const [gameData, setGameData] = useState(null)
    const [isReadOnly, setIsReadOnly] = useState(false)

    const isGameOver = gameData?.game?.winner_id || gameData?.game?.draw_reason

    useEffect(() => {
        if (!gameID || gameID === "undefined") return

        async function fetchGame() {
            try {
                const res = await api.get(`/game/${gameID}`)
                console.log("Fetched game data:", res.data)

                if (res.data.game.status === "finished") {
                    setIsReadOnly(true)
                }

                setGameData(res.data)
            } catch (e) {
                console.error("Failed to fetch game:", e)
            }
        }

        fetchGame()
    }, [gameID])

    useEffect(() => {
        if (!gameID || gameID === "undefined" || isReadOnly) return
        if (!socket) return

        function requestSync() {
            socket.emit("game:sync-state", gameID)
        }

        requestSync()

        socket.on("connect", () => {
            requestSync()
        })

        socket.on("game:updated", (serverData) => {
            console.log("serverdata via socket", serverData)
            setGameData(serverData)
        })

        return () => {
            socket.off("connect")
            socket.off("game:updated")
        }
    }, [socket, gameID, isReadOnly])

    return (
        <ChessContext.Provider value={{ gameData, setGameID, isGameOver, isReadOnly }}>
            {children}
        </ChessContext.Provider>
    )
}

export const useChess = () => useContext(ChessContext)