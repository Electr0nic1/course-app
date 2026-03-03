import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Spin } from 'antd'

export function PublicOnlyRoute({ children }) {
  const { isAuth, bootLoading } = useAuth()

  if (bootLoading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (isAuth) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}