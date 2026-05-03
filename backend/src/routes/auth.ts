import { Router } from 'express'
import {
  signup,
  login,
  me,
  completeTwoFA,
  changePassword,
  setup2FA,
  verify2FA,
  disable2FA,
} from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/signup', signup)
router.post('/login', login)
router.get('/me', authenticate, me)
router.post('/2fa/complete', completeTwoFA)
router.post('/change-password', authenticate, changePassword)
router.post('/2fa/setup', authenticate, setup2FA)
router.post('/2fa/verify', authenticate, verify2FA)
router.post('/2fa/disable', authenticate, disable2FA)

export default router
