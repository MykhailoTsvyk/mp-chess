import express from "express";
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser'
import userRoutes from "./routes/user.routes.js";
import EmailService from "./services/email.service.js";

const app = express()
const port = process.env.PORT || 3000

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())
app.use("/api", userRoutes)


await EmailService.verify()

app.listen(port, () => {
    console.log(`listening on port: ${port}`)
})