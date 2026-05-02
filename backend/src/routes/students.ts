import { Router } from 'express'
import { list, getOne, create, update, remove } from '../controllers/students.controller.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

const router = Router()

router.get('/', authenticate, list)
router.get('/:id', authenticate, getOne)
router.post('/', authenticate, requireRole('ADMIN'), create)
router.put('/:id', authenticate, requireRole('ADMIN'), update)
router.delete('/:id', authenticate, requireRole('ADMIN'), remove)

export default router
