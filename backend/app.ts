import Koa from "koa"
import https from "https"
import fs from "fs"
import dotenv from "dotenv"
import Debug from "debug"
import defaultVersionRouter from "./versions/latest/router"
import cors from "@koa/cors"

const debug = Debug("webgest:app.ts")

dotenv.config()

const app = new Koa()
// allow cors for localhost:5173
app.use(cors({ origin: `https://${process.env.FRONTEND_HOST}` }))

app.use(defaultVersionRouter.routes())

if (process.env.NODE_ENV === "dev") {
  // set https server
  const options = {
    key: fs.readFileSync('localhost-key.pem'),
    cert: fs.readFileSync('localhost.pem')
  }
  const server = https.createServer(options, app.callback())
  server.listen(process.env.PORT, () => {
    debug(`Debugging server is running on https://localhost:${process.env.PORT}`)
  })
} else {
  app.listen(process.env.PORT, () => {
    debug("Server is running on port " + process.env.PORT)
  })
}
