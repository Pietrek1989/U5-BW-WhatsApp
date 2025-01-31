import Express from "express"
import cors from "cors"
import mongoose from "mongoose"
import {Server} from "socket.io"
import {createServer} from "http"
import {newConnectionHandler} from "./api/chat/index.js"
import {badRequestHandler, unauthorizedHandler, notfoundHandler, genericErrorHandler, forbiddenErrorHandler} from "./errorHandlers.js"
import usersRouter from "./api/users/index.js"
import createHttpError from "http-errors"
import passport from "passport"
import { googleStrategy } from "./lib/tools.js"
import chatsRouter from "./api/chat/index.js"

const server = Express()
const port = process.env.PORT || 3420
const whitelist = [process.env.FE_URL]

passport.use("google", googleStrategy)

server.use(cors({
    origin: (currentOrigin, corsNext) => {
        if (!currentOrigin || whitelist.indexOf(currentOrigin) !== -1) {
            corsNext(null, true)
        } else {
            corsNext(createHttpError(400, `Origin ${currentOrigin} is not whitelisted.`))
        }
    }
}))

server.use(Express.json())
server.use(passport.initialize())

server.use("/users", usersRouter)
server.use("/chats", chatsRouter)

server.use(badRequestHandler)
server.use(unauthorizedHandler)
server.use(forbiddenErrorHandler)
server.use(notfoundHandler)
server.use(genericErrorHandler)

const httpServer = createServer(server)
export const io = new Server(httpServer)
io.on("connection", newConnectionHandler)

mongoose.connect(process.env.MONGO_URL)

mongoose.connection.on("connected", () => {
    httpServer.listen(port, () => {
        console.log(`Server listening on Port ${port}`)
    })
})