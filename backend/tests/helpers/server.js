import http from "node:http"
import express from "express"
import cookieParser from "cookie-parser"
import {Server} from "socket.io"
import {io as connect} from "socket.io-client"
import userRoutes from "../../routes/user.routes.js"
import gameRoutes from "../../routes/game.routes.js"
import {socketAuthMiddleware} from "../../middleware/auth.middleware.js"
import {registerSocketHandlers} from "../../socket/socket.js"
import tokenService from "../../services/token.service.js"
import UserDto from "../../dtos/user.dto.js"

// the app's routes, socket middleware and handlers on a random port, without the
// email check, cron job and fixed port of index.js
export async function startServer() {
    const app = express()
    app.use(express.json())
    app.use(cookieParser())
    app.use("/api", userRoutes)
    app.use("/api", gameRoutes)

    const httpServer = http.createServer(app)
    const io = new Server(httpServer)
    io.use(socketAuthMiddleware)
    registerSocketHandlers(io)

    await new Promise(resolve => httpServer.listen(0, resolve))

    return {
        app,
        io,
        url: `http://localhost:${httpServer.address().port}`,
        close: () => new Promise(resolve => io.close(() => resolve())),
    }
}

// logs the user in the way the app does: a refresh token saved in the DB and sent as a cookie
export async function issueTokens(user) {
    const tokens = tokenService.generateTokens({...new UserDto(user)})
    await tokenService.saveToken(user.id, tokens.refresh)
    return tokens
}

// resolves with the connected socket, or rejects with the connect_error
export function connectWithCookie(url, cookie) {
    const socket = connect(url, {
        transports: ["websocket"],
        forceNew: true,
        reconnection: false,
        extraHeaders: cookie ? {cookie} : {},
    })

    return new Promise((resolve, reject) => {
        socket.once("connect", () => resolve(socket))
        socket.once("connect_error", (err) => {
            socket.close()
            reject(err)
        })
    })
}

export async function connectAs(url, user) {
    const {refresh} = await issueTokens(user)
    const socket = await connectWithCookie(url, `refreshToken=${refresh}`)
    socket.user = user
    return socket
}

// the next event that matches, or a timeout error naming the event
export function nextEvent(socket, event, matches = () => true, timeoutMs = 3000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            socket.off(event, handler)
            reject(new Error(`timed out waiting for "${event}"`))
        }, timeoutMs)

        function handler(data) {
            if (!matches(data)) return
            clearTimeout(timer)
            socket.off(event, handler)
            resolve(data)
        }

        socket.on(event, handler)
    })
}

// collects every payload of an event, to check that something did NOT happen
export function recordEvents(socket, event) {
    const received = []
    socket.on(event, data => received.push(data))
    return received
}

export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))
