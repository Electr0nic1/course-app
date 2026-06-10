import React, { useMemo } from 'react'
import { Card, Col, Row, Statistic, Typography, Tag, Space } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { Line } from '@ant-design/plots'
import dayjs from 'dayjs'
import { dashboardSummaryApi } from '../api/dashboard.api'
import { useAuth } from '../context/AuthContext.jsx'
import { ROLE_LABELS } from '../constants/roles'
import { TRAINING_PARTICIPATION_STATUS } from '../constants/trainingParticipationStatus.js'

function percent(done, total) {
  if (!total) return 0
  return Math.round((done / total) * 100)
}

export function DashboardPage() {
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardSummaryApi,
  })

  const role = user?.role
  const roleRu = ROLE_LABELS[role] ?? '—'

  const trainingsCounts = data?.trainings?.counts
  const nearest = data?.trainings?.nearest

  const completion = useMemo(() => {
    const done = trainingsCounts?.done ?? 0
    const total = trainingsCounts?.total ?? 0
    return percent(done, total)
  }, [trainingsCounts])

  const selfControlRecords  = data?.self_controls ?? []
  const chartData = useMemo(() => {
    // строим график пульса как пример
    return selfControlRecords 
      .map((x) => ({
        date: dayjs(x.date).format('DD.MM'),
        heart_rate: x.heart_rate ?? null,
      }))
      .reverse()
      .filter((x) => x.heart_rate !== null)
  }, [selfControlRecords ])

  const heartRateConfig = {
    data: chartData,
    xField: 'date',
    yField: 'heart_rate',
    height: 240,
    autoFit: true,
    smooth: true,
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card loading={isLoading}>
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
            <Statistic title="Роль в системе" value={roleRu} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Электронная почта" value={user?.email ?? '—'} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="ID пользователя" value={user?.id ?? '—'} />
          </Card>
        </Col>
      </Row>

      {role === 'athlete' && (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card loading={isLoading}>
              <Statistic title="Назначено тренировок" value={trainingsCounts?.total ?? 0} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card loading={isLoading}>
              <Statistic title="Выполнено тренировок" value={trainingsCounts?.done ?? 0} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card loading={isLoading}>
              <Statistic title="Выполнение тренировок" value={completion} suffix="%" />
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="Ближайшая назначенная тренировка" loading={isLoading}>
              {!nearest ? (
                <Typography.Text type="secondary">Нет запланированных тренировок</Typography.Text>
              ) : (
                <Space direction="vertical" size={4}>
                  <Typography.Text>
                    Дата и время: <b>{dayjs(nearest.date).format('DD.MM.YYYY HH:mm')}</b>
                  </Typography.Text>
                  <Typography.Text>
                    Продолжительность: <b>{nearest.duration_minutes} мин</b>
                  </Typography.Text>
                  <div>
                    Статус выполнения:{' '}
                    <Tag color={TRAINING_PARTICIPATION_STATUS[nearest.status]?.color}>
                      {TRAINING_PARTICIPATION_STATUS[nearest.status]?.label ?? nearest.status}
                    </Tag>
                  </div>
                </Space>
              )}
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="Изменение пульса по последним записям" loading={isLoading}>
              {chartData.length ? <Line {...heartRateConfig} /> : <Typography.Text type="secondary">Пока нет записей самоконтроля для построения графика</Typography.Text>}
            </Card>
          </Col>
        </Row>
      )}
    </div>
  )
}