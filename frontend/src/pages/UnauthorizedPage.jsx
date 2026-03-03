import React from 'react'
import { Button, Card, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

export function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <Card>
      <Result
        status="403"
        title="Доступ запрещён"
        subTitle="У вас нет прав для просмотра этой страницы."
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            На главную
          </Button>
        }
      />
    </Card>
  )
}
