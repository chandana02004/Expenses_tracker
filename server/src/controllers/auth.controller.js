import { registerUser, loginUser, getUserById, updateUser, changePassword, deleteUser } from '../services/auth.service.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

export async function register(req, res, next) {
  try {
    const user = await registerUser(req.body)
    const accessToken = signAccessToken({ id: user.id })
    const refreshToken = signRefreshToken({ id: user.id })
    res.cookie('refreshToken', refreshToken, COOKIE_OPTS)
    res.status(201).json({ user, accessToken })
  } catch (err) { next(err) }
}

export async function login(req, res, next) {
  try {
    const user = await loginUser(req.body)
    const accessToken = signAccessToken({ id: user.id })
    const refreshToken = signRefreshToken({ id: user.id })
    res.cookie('refreshToken', refreshToken, COOKIE_OPTS)
    res.json({ user, accessToken })
  } catch (err) { next(err) }
}

export async function refresh(req, res) {
  const token = req.cookies?.refreshToken
  if (!token) return res.status(401).json({ error: 'No refresh token' })
  try {
    const payload = verifyRefreshToken(token)
    res.json({ accessToken: signAccessToken({ id: payload.id }) })
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' })
  }
}

export async function getMe(req, res, next) {
  try {
    res.json({ user: await getUserById(req.user.id) })
  } catch (err) { next(err) }
}

export async function updateMe(req, res, next) {
  try {
    const allowed = [
      'name','currency','phone','occupation','monthlyIncome',
      'salaryDate','financialYearStart','alertThreshold','language','notifications',
    ]
    const data = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    )
    res.json({ user: await updateUser(req.user.id, data) })
  } catch (err) { next(err) }
}

export async function changePasswordHandler(req, res, next) {
  try {
    await changePassword(req.user.id, req.body)
    res.json({ message: 'Password updated successfully' })
  } catch (err) { next(err) }
}

export async function deleteAccount(req, res, next) {
  try {
    await deleteUser(req.user.id)
    res.clearCookie('refreshToken')
    res.json({ message: 'Account deleted' })
  } catch (err) { next(err) }
}

export async function logout(req, res) {
  res.clearCookie('refreshToken')
  res.json({ message: 'Logged out' })
}
