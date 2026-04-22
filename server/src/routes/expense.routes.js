import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import authMiddleware from '../middleware/auth.middleware.js'
import {
  getExpenses, addExpense, editExpense, removeExpense, exportCSV,
  getRecurring, addRecurring, editRecurring, removeRecurring, triggerRecurring,
} from '../controllers/expense.controller.js'

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`),
})
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } })

const router = Router()
router.use(authMiddleware)

router.get('/',           getExpenses)
router.get('/export',     exportCSV)
router.post('/',          upload.single('receipt'), addExpense)
router.put('/:id',        upload.single('receipt'), editExpense)
router.delete('/:id',     removeExpense)

router.get('/recurring',        getRecurring)
router.post('/recurring',       addRecurring)
router.put('/recurring/:id',    editRecurring)
router.delete('/recurring/:id', removeRecurring)
router.post('/recurring/:id/apply', triggerRecurring)

export default router
