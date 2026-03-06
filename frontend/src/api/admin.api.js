import { http } from './http.js'

// Администрирование
// Предполагаемый API:
// GET /admin/users
// POST /admin/users
// PATCH /admin/users/:id
// DELETE /admin/users/:id

export async function listUsersApi(params = {}) {
  const { data } = await http.get('/admin/users', { params })
  return data
}

export async function createUserApi(payload) {
  const { data } = await http.post('/admin/users', payload)
  return data
}

export async function updateUserApi(id, payload) {
  const { data } = await http.patch(`/admin/users/${id}`, payload)
  return data
}

export async function deleteUserApi(id) {
  const { data } = await http.delete(`/admin/users/${id}`)
  return data
}

export async function listActivityLogsApi(params) {
  const { data } = await http.get('/admin/activity-logs', { params })
  return data
}