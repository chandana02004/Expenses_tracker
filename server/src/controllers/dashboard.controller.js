import { getDashboardData } from '../services/dashboard.service.js'

export async function getDashboard(req, res, next) {
  try {
    const month =
      req.query.month ||
      (() => {
        const n = new Date()
        return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
      })()

    const data = await getDashboardData(req.user.id, month)
    res.json(data)
  } catch (err) {
    next(err)
  }
}
