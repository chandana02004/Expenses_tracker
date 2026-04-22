import { Router } from 'express'
import authMiddleware from '../middleware/auth.middleware.js'
import { listCategories, createCategory, updateCategory, deleteCategory } from '../services/category.service.js'

const router = Router()
router.use(authMiddleware)

router.get('/', async (req, res, next) => {
  try { res.json(await listCategories(req.user.id)) } catch (e) { next(e) }
})
router.post('/', async (req, res, next) => {
  try { res.status(201).json(await createCategory(req.user.id, req.body)) } catch (e) { next(e) }
})
router.put('/:id', async (req, res, next) => {
  try { res.json(await updateCategory(req.user.id, req.params.id, req.body)) } catch (e) { next(e) }
})
router.delete('/:id', async (req, res, next) => {
  try { await deleteCategory(req.user.id, req.params.id); res.json({ message: 'Deleted' }) } catch (e) { next(e) }
})

export default router
