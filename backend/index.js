import express from "express";
import cors from 'cors';
import 'dotenv/config';
import {Server} from "socket.io";
import cookieParser from 'cookie-parser';
import userRoutes from "./routes/user.routes.js";
import EmailService from "./services/email.service.js";
import {socketAuthMiddleware} from "./middleware/auth.middleware.js";
import {registerSocketHandlers} from "./socket/socket.js";
import {initTokenCleanupJob} from "./jobs/verificationTokens.job.js";

const app = express()
const port = process.env.PORT || 3000

initTokenCleanupJob()

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())
app.use("/api", userRoutes)

await EmailService.verify()

const server = app.listen(port, () => {
    console.log(`listening on port: ${port}`)
})

export const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true
    }
})

io.use(socketAuthMiddleware)
registerSocketHandlers(io)