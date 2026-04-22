import api from './axios'

export const getExpenses     = (params) => api.get('/expenses', { params })
export const createExpense   = (data)   => api.post('/expenses', data)        // FormData
export const updateExpense   = (id, data) => api.put(`/expenses/${id}`, data) // FormData
export const deleteExpense   = (id)     => api.delete(`/expenses/${id}`)

export const getRecurring    = ()       => api.get('/expenses/recurring')
export const createRecurring = (data)   => api.post('/expenses/recurring', data)
export const updateRecurring = (id, d)  => api.put(`/expenses/recurring/${id}`, d)
export const deleteRecurring = (id)     => api.delete(`/expenses/recurring/${id}`)
export const applyRecurring  = (id)     => api.post(`/expenses/recurring/${id}/apply`)

export const exportCSV = async (params) => {
  const res = await api.get('/expenses/export', { params, responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([res.data]))
  const a = document.createElement('a')
  a.href = url
  a.download = 'expenses.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
