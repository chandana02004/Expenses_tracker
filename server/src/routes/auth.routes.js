import { Router } from 'express'
import { body } from 'express-validator'
import validateMiddleware from '../middleware/validate.middleware.js'
import authMiddleware from '../middleware/auth.middleware.js'
import {
  register, login, refresh, getMe, updateMe,
  changePasswordHandler, deleteAccount, logout,
} from '../controllers/auth.controller.js'

const router = Router()

router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validateMiddleware, register
)

router.post('/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateMiddleware, login
)

router.post('/refresh', refresh)
router.post('/logout', logout)
router.get('/me', authMiddleware, getMe)
router.put('/me', authMiddleware, updateMe)
router.put('/password', authMiddleware,
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ],
  validateMiddleware, changePasswordHandler
)
router.delete('/me', authMiddleware, deleteAccount)

export default router
