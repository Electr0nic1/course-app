import React from 'react'
import { Button, Card, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <Card>
      <Result
        status="404"
        title="Страница не найдена"
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            На главную
          </Button>
        }
      />
    </Card>
  )
}
