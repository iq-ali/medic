import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import dashboardRoutes from './routes/dashboard.js'
import studentsRoutes from './routes/students.js'
import staffRoutes from './routes/staff.js'
import medicalRoutes from './routes/medical.js'
import appointmentsRoutes from './routes/appointments.js'

const app = express()
const PORT = process.env.PORT ?? 3000

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:5173']
  : ['http://localhost:5173']
app.use(cors({ origin: allowedOrigins }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/students', studentsRoutes)
app.use('/api/staff', staffRoutes)
app.use('/api/medical', medicalRoutes)
app.use('/api/appointments', appointmentsRoutes)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
