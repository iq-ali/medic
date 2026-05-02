import { Router } from 'express'
import { stats } from '../controllers/dashboard.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/stats', authenticate, stats)

export default router
