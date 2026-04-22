import { useNavigate } from 'react-router-dom'
import useStore from '@/store/useStore'
import { login as loginApi, register as registerApi } from '@/api/auth'

export function useAuth() {
  const { setUser, setAccessToken, logout: clearStore } = useStore()
  const navigate = useNavigate()

  async function login(data) {
    const res = await loginApi(data)
    setUser(res.data.user)
    setAccessToken(res.data.accessToken)
    navigate('/dashboard')
  }

  async function register(data) {
    const res = await registerApi(data)
    setUser(res.data.user)
    setAccessToken(res.data.accessToken)
    navigate('/dashboard')
  }

  function logout() {
    clearStore()
    navigate('/login')
  }

  return { login, register, logout }
}
