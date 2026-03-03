import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '../context/AuthContext.jsx'

export function RequireAuth({ children }) {
  const { isAuth, bootLoading } = useAuth()
  const location = useLocation()

  if (bootLoading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return children
}

export function RequireRole({ allow, children }) {
  const { user, isAuth, bootLoading } = useAuth()
  const location = useLocation()

  // 1) пока грузим /me — никаких редиректов
  if (bootLoading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  // 2) если токена нет — это не "unauthorized", это "login"
  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // 3) роль проверяем только после bootLoading=false
  const role = user?.role // ожидаем: 'athlete' | 'coach' | 'admin'

  if (!role) {
    // если user не загрузился по какой-то причине, но токен есть — безопаснее тоже на login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  const allowed = Array.isArray(allow) ? allow : [allow]
  if (!allowed.includes(role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}