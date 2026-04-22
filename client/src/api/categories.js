import useStore from '@/store/useStore'

const BASE = (import.meta.env.VITE_API_URL || '') + '/api'

function authHeaders(json = true) {
  const token = useStore.getState().accessToken
  const h = {}
  if (token) h['Authorization'] = `Bearer ${token}`
  if (json) h['Content-Type'] = 'application/json'
  return h
}

async function handle(res) {
  const text = await res.text()
  let body
  try { body = JSON.parse(text) } catch { body = { error: text } }
  if (!res.ok) {
    const err = new Error(body?.error || body?.message || `Request failed with status ${res.status}`)
    err.status = res.status
    err.response = { data: body }
    throw err
  }
  return body
}

export const getCategories = () =>
  fetch(`${BASE}/categories`, { headers: authHeaders() }).then(handle)

export const createCategory = (data) =>
  fetch(`${BASE}/categories`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handle)

export const updateCategory = (id, data) =>
  fetch(`${BASE}/categories/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handle)

export const deleteCategory = (id) =>
  fetch(`${BASE}/categories/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then(handle)
