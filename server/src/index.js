import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { router as apiRouter } from './routes/index.js'

dotenv.config()

const app = express()
app.use(express.json())
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }))
app.use(helmet())

app.get('/health', (req, res) => res.json({ ok: true }))
app.use('/api', apiRouter)

const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN }
})

// Attach io globally for simplicity
app.set('io', io)

io.on('connection', (socket) => {
  socket.on('disconnect', () => {})
})

const port = process.env.PORT || 3001
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${port}`)
})

