import {createContext, useContext, useEffect, useState} from "react";
import {useSocket} from "./SocketContext.jsx";
import {useAuth} from "./AuthContext.jsx";


const ChessContext = createContext()

export default function ChessProvider({children}) {
    const [gameID, setGameID] = useState()
    const {socket} = useSocket()
    const {user} = useAuth()
    const [gameData, setGameData] = useState(null)
    console.log("gamedata", gameData)
    console.log(gameID)

    console.log(gameID)

    useEffect(() => {
        function requestSync() {
            socket.emit("game:sync-state", gameID)
        }
        requestSync()

        socket.on("connect", () => {
            requestSync()
        })

        socket.on("game:updated", (serverData) => {
            console.log("serverdata", serverData)
            setGameData(serverData)
        })
    }, [socket, gameID]);



    return (
        <ChessContext value={{gameData, setGameID}}>
            {children}
        </ChessContext>
    )
}

export const useChess = () => useContext(ChessContext)