import { http } from './http.js'

// Ожидаемый контракт (можешь подогнать под свой бэкенд):
// POST /auth/login { email, password } -> { token, user }
// GET  /me -> user

export async function loginApi({ email, password }) {
  const { data } = await http.post('/auth/login', { email, password })
  return data
}

export async function getMeApi() {
  const { data } = await http.get('/auth/me')
  return data
}

export async function logoutApi() {
  const { data } = await http.post('/auth/logout')
  return data
}