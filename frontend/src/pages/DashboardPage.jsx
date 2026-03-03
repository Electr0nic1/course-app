import React from 'react'
import { Card, Col, Row, Statistic, Typography } from 'antd'
import { useAuth } from '../context/AuthContext.jsx'
import { ROLE_LABELS } from '../constants/roles.js'

export function DashboardPage() {
  const { user } = useAuth()

  console.log(user)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card>
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          Добро пожаловать, {user?.full_name ?? '—'}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Это стартовая панель АИС дневника самоконтроля спортсмена.
        </Typography.Paragraph>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Роль" value={ROLE_LABELS[user?.role] ?? '—'} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Email" value={user?.email ?? '—'} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="ID" value={user?.id ?? '—'} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

