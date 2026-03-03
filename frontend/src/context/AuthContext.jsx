import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getMeApi, logoutApi } from '../api/auth.api.js'
import { normalizeUser } from '../helpers/normalizeUser.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [bootLoading, setBootLoading] = useState(() => !!localStorage.getItem('token'))
  const [user, setUser] = useState(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) setToken(savedToken)
    else setBootLoading(false)
  }, [])

  useEffect(() => {
    let alive = true

    async function bootstrap() {
      if (!token) {
        if (alive) setBootLoading(false)
        return
      }

      try {
        // token will be attached by axios interceptor
        const me = await getMeApi()
        // console.log(me)
        if (alive) setUser(normalizeUser(me?.user))
      } catch (e) {
        localStorage.removeItem('token')
        if (alive) {
          setToken(null)
          setUser(null)
        }
      } finally {
        if (alive) setBootLoading(false)
      }
    }

    bootstrap()
    return () => { alive = false }
  }, [token])

  const login = ({ token, user }) => {
    localStorage.setItem('token', token)
    setToken(token)
    setUser(user ?? null)
    setBootLoading(false)
  }

  // const logout = () => {
  //   localStorage.removeItem('token')
  //   setToken(null)
  //   setUser(null)
  //   setBootLoading(false)
  // }

  const logout = async () => {
    try {
      if (localStorage.getItem('token')) {
        await logoutApi()
      }
    } catch (e) {
      
    } finally {
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
      setBootLoading(false)
    }
  }

  const value = useMemo(() => ({
    token,
    user,
    isAuth: !!token,
    bootLoading,
    login,
    logout,
  }), [token, user, bootLoading])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}