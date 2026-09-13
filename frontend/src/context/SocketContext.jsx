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

    useEffect(() => {
        if (!isAuthenticated) return

        socket.connect()

        function onConnect(){
            setIsConnected(true)
            console.log("socket connected", socket.id)
        }

        function onDisconnect(){
            setIsConnected(false)
        }

        socket.on("connect", onConnect)
        socket.on("disconnect", onDisconnect)

        // cleanup to prevent double events
        return () => {
            socket.off("connect", onConnect)
            socket.off("disconnect", onDisconnect)
            socket.disconnect()
        }

    }, [isAuthenticated])

    return (
        <SocketContext value={{socket, isConnected}}>
            {children}
        </SocketContext>
    )

}

export const useSocket = () => useContext(SocketContext)