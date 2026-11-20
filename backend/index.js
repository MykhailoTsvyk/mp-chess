import express from "express";
import path from "node:path";
import cors from 'cors';
import 'dotenv/config';
import {Server} from "socket.io";
import cookieParser from 'cookie-parser';
import userRoutes from "./routes/user.routes.js";
import EmailService from "./services/email.service.js";
import {socketAuthMiddleware} from "./middleware/auth.middleware.js";
import {registerSocketHandlers} from "./socket/socket.js";
import {initTokenCleanupJob} from "./jobs/verificationTokens.job.js";
import gameRoutes from "./routes/game.routes.js";
import notificationRoutes from "./routes/notification.routes.js"

const app = express()
const port = process.env.PORT || 3000

initTokenCleanupJob()

// Render's proxy handles HTTPS in front of the app; this makes Express see the real protocol and client IP
app.set("trust proxy", 1)

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())
app.use("/api", userRoutes)
app.use("/api", gameRoutes)
app.use("/api/notifications", notificationRoutes)

// in production this server also serves the built React app (one domain, so the refresh cookie just works)
if (process.env.NODE_ENV === "production") {
    const distPath = path.join(import.meta.dirname, "../frontend/dist")

    // unknown API paths answer with JSON instead of falling through to the app below
    app.use("/api", (req, res) => res.status(404).json({message: "Not found"}))

    app.use(express.static(distPath))

    // client-side routes like /game/123 aren't files: send the app and let React Router read the URL
    app.get("/{*splat}", (req, res) => res.sendFile(path.join(distPath, "index.html")))
}

await EmailService.verify()

const server = app.listen(port, () => {
    console.log(`listening on port: ${port}`)
})

export const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true
    }
})

io.use(socketAuthMiddleware)
registerSocketHandlers(io)