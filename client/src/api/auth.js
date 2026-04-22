import api from './axios'

export const register       = (data) => api.post('/auth/register', data)
export const login          = (data) => api.post('/auth/login', data)
export const refresh        = ()     => api.post('/auth/refresh')
export const getMe          = ()     => api.get('/auth/me')
export const updateMe       = (data) => api.put('/auth/me', data)
export const changePassword = (data) => api.put('/auth/password', data)
export const deleteAccount  = ()     => api.delete('/auth/me')
