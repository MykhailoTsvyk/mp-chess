import {io} from "socket.io-client";
import {createContext, useContext, useEffect, useRef, useState} from "react";
import {useAuth} from "./AuthContext.jsx";
import {refreshSession} from "../api/axios.js";

const socket = io("http://localhost:3000/", {
    withCredentials: true,
    autoConnect: false
})

const SocketContext = createContext(socket)

export default function SocketProvider({children}) {
    const {isAuthenticated, user, login, logout} = useAuth()
    const isActivated = Boolean(user?.is_activated)
    const [isConnected, setIsConnected] = useState(socket.connected)
    const [socketError, setSocketError] = useState('')
    // code sent by the server's socket auth middleware: "SESSION_EXPIRED" or "NOT_VERIFIED"
    const [socketErrorCode, setSocketErrorCode] = useState(null)

    // latest login/logout without making the connection effect depend on them
    const authRef = useRef({login, logout})
    useEffect(() => {
        authRef.current = {login, logout}
    })

    // one refresh attempt per rejected session, reset after a successful connection
    const hasTriedRefresh = useRef(false)

    useEffect(() => {
        if (!isAuthenticated) return

        socket.connect()

        function onConnect(){
            setIsConnected(true)
            setSocketError('')
            setSocketErrorCode(null)
            hasTriedRefresh.current = false
        }

        function onDisconnect(){
            setIsConnected(false)
        }

        function onConnectError(err) {
            console.error("Socket Connection Error:", err.message)
            setIsConnected(false)
            setSocketError(err.message)
            setSocketErrorCode(err.data?.code ?? null)

            if (err.data?.code !== "SESSION_EXPIRED") return

            // the refresh cookie no longer matches a session: try to refresh once, otherwise log out
            if (hasTriedRefresh.current) {
                authRef.current.logout()
                return
            }

            hasTriedRefresh.current = true
            refreshSession()
                .then((data) => {
                    authRef.current.login(data)
                    socket.connect()
                })
                .catch(() => authRef.current.logout())
        }

        socket.on("connect", onConnect)
        socket.on("disconnect", onDisconnect)
        socket.on("connect_error", onConnectError)

        // cleanup to prevent double events
        return () => {
            socket.off("connect", onConnect)
            socket.off("disconnect", onDisconnect)
            socket.off("connect_error", onConnectError)
            socket.disconnect()
        }

    // reconnecting when the email gets verified lets the server accept the socket
    }, [isAuthenticated, isActivated])

    return (
        <SocketContext value={{socket, isConnected, socketError, socketErrorCode}}>
            {children}
        </SocketContext>
    )
}

export const useSocket = () => useContext(SocketContext)
