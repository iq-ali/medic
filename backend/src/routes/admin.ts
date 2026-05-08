import { Router } from 'express'
import {
  getAllUsers,
  getPendingUsers,
  approveUser,
  rejectUser,
  getSettings,
  updateSettings,
  getPendingRecords,
  approveRecord,
  rejectRecord,
} from '../controllers/admin.controller.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

const router = Router()

router.use(authenticate, requireRole('ADMIN'))

router.get('/users', getAllUsers)
router.get('/pending-users', getPendingUsers)
router.post('/users/:id/approve', approveUser)
router.delete('/users/:id', rejectUser)
router.get('/settings', getSettings)
router.put('/settings', updateSettings)
router.get('/pending-records', getPendingRecords)
router.post('/records/:type/:id/approve', approveRecord)
router.delete('/records/:type/:id', rejectRecord)

export default router
