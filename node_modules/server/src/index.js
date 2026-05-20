import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import { initDb, getDb } from './lib/db.js'
import { authRouter } from './routes/authRoutes.js'
import { adminRouter } from './routes/adminRoutes.js'
import { employeeRouter } from './routes/employeeRoutes.js'
import { travelRouter } from './routes/travelRoutes.js'
import { overtimeRouter } from './routes/overtimeRoutes.js'


dotenv.config()

const app = express()

// Export app for serverless environments (Vercel)
export { app }

const allowedOrigins = process.env.CLIENT_ORIGIN?.split(',')?.map(s => s.trim()) || ['http://localhost:5173']
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true)
    callback(new Error(`CORS origin denied: ${origin}`))
  }
}))
app.use(express.json())

await initDb()

app.get('/health', (req, res) => res.json({ ok: true }))

app.use('/auth', authRouter)
app.use('/admin', adminRouter)
app.use('/employee', employeeRouter)
app.use('/travel', travelRouter)
app.use('/overtime', overtimeRouter)


const port = Number(process.env.PORT || 4000)

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})

// Helpful for debugging in dev
process.on('SIGINT', () => {
  try {
    const db = getDb()
    db?.close?.()
  } catch {}
  process.exit(0)
})

