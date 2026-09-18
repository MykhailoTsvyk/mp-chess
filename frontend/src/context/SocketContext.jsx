import {io} from "socket.io-client";
import {createContext, useContext, useEffect, useState} from "react";
import {useAuth} from "./AuthContext.jsx";

const socket = io("http://localhost:3000/", {
    withCredentials: true,
    autoConnect: false
})

const SocketContext = createContext(socket)

export default function SocketProvider({children}) {
    const {isAuthenticated} = useAuth()
    const [isConnected, setIsConnected] = useState(socket.connected)
    const [socketError, setSocketError] = useState('')

    useEffect(() => {
        if (!isAuthenticated) return

        socket.connect()

        function onConnect(){
            setIsConnected(true)
        }

        function onDisconnect(){
            setIsConnected(false)
        }

        function onConnectError(err) {
            console.error("Socket Connection Error:", err.message)
            setIsConnected(false)
            setSocketError(err.message)
        }

        socket.on("connect", onConnect)
        socket.on("disconnect", onDisconnect)
        socket.on("connect_error", onConnectError)

        // cleanup to prevent double events
        return () => {
            socket.off("connect", onConnect)
            socket.off("disconnect", onDisconnect)
            socket.disconnect()
        }

    }, [isAuthenticated])

    return (
        <SocketContext value={{socket, isConnected, socketError}}>
            {children}
        </SocketContext>
    )
}

export const useSocket = () => useContext(SocketContext)