import axios from 'axios'
import { API_URL } from '../helpers/config.js'

/**
 * Axios instance configured for this project.
 *
 * Auth:
 * - access token is stored in localStorage under key "token"
 * - Authorization: Bearer <token>
 */
export const http = axios.create({
  baseURL: API_URL,
  timeout: 20_000,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (res) => res,
  (err) => {
    // Normalize error shape: throw { message, status, details }
    const status = err?.response?.status
    const details = err?.response?.data
    const message =
      details?.message ||
      err?.message ||
      'Ошибка сети. Проверьте подключение и повторите попытку.'

    const normalized = { message, status, details }

    // if token is invalid/expired
    if (status === 401) {
      localStorage.removeItem('token')
    }

    return Promise.reject(normalized)
  },
)
