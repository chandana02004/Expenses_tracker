import {
  listExpenses, createExpense, updateExpense, deleteExpense, exportExpensesCSV,
  listRecurring, createRecurring, updateRecurring, deleteRecurring, applyRecurring,
} from '../services/expense.service.js'

export async function getExpenses(req, res, next) {
  try {
    res.json(await listExpenses(req.user.id, req.query))
  } catch (err) { next(err) }
}

export async function addExpense(req, res, next) {
  try {
    const data = { ...req.body }
    if (req.file) data.receipt = req.file.filename
    res.status(201).json(await createExpense(req.user.id, data))
  } catch (err) { next(err) }
}

export async function editExpense(req, res, next) {
  try {
    const data = { ...req.body }
    if (req.file) data.receipt = req.file.filename
    res.json(await updateExpense(req.user.id, req.params.id, data))
  } catch (err) { next(err) }
}

export async function removeExpense(req, res, next) {
  try {
    await deleteExpense(req.user.id, req.params.id)
    res.json({ message: 'Deleted' })
  } catch (err) { next(err) }
}

export async function exportCSV(req, res, next) {
  try {
    const csv = await exportExpensesCSV(req.user.id, req.query)
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"')
    res.send(csv)
  } catch (err) { next(err) }
}

export async function getRecurring(req, res, next) {
  try { res.json(await listRecurring(req.user.id)) } catch (err) { next(err) }
}

export async function addRecurring(req, res, next) {
  try { res.status(201).json(await createRecurring(req.user.id, req.body)) } catch (err) { next(err) }
}

export async function editRecurring(req, res, next) {
  try { res.json(await updateRecurring(req.user.id, req.params.id, req.body)) } catch (err) { next(err) }
}

export async function removeRecurring(req, res, next) {
  try { await deleteRecurring(req.user.id, req.params.id); res.json({ message: 'Deleted' }) } catch (err) { next(err) }
}

export async function triggerRecurring(req, res, next) {
  try { res.json(await applyRecurring(req.user.id, req.params.id)) } catch (err) { next(err) }
}
