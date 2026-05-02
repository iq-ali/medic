import { Router } from 'express'
import { list, getOne, create, update, remove } from '../controllers/medical.controller.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

const router = Router()

router.get('/', authenticate, list)
router.get('/:id', authenticate, getOne)
router.post('/', authenticate, requireRole('ADMIN', 'DOCTOR'), create)
router.put('/:id', authenticate, requireRole('ADMIN', 'DOCTOR'), update)
router.delete('/:id', authenticate, requireRole('ADMIN'), remove)

export default router
