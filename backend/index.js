import express from "express"
import 'dotenv/config';
import userRoutes from "./routes/user.routes.js";

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use("/api", userRoutes)

app.listen(port, () => {
    console.log(`listening on port: ${port}`)
})