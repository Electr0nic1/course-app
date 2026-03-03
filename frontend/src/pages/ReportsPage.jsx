import React, { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Card, DatePicker, InputNumber, Space, Table, Typography } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { getCoachReportApi } from '../api/reports.api.js'

function normalizeList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  return []
}

export function ReportsPage() {
  const [athleteId, setAthleteId] = useState(1)
  const [range, setRange] = useState([dayjs().subtract(14, 'day'), dayjs()])

  const { data, isLoading, error } = useQuery({
    queryKey: ['coach-report', athleteId, range?.[0]?.format('YYYY-MM-DD'), range?.[1]?.format('YYYY-MM-DD')],
    queryFn: () =>
      getCoachReportApi({
        athleteId,
        from: range?.[0]?.format('YYYY-MM-DD'),
        to: range?.[1]?.format('YYYY-MM-DD'),
      }),
    enabled: !!athleteId,
  })

  const diary = useMemo(() => normalizeList(data?.diary), [data])
  const trainings = useMemo(() => normalizeList(data?.trainings), [data])

  const diaryCols = [
    { title: 'Дата', dataIndex: 'date', key: 'date', render: (v) => (v ? dayjs(v).format('DD.MM HH:mm') : '—') },
    { title: 'Пульс', dataIndex: 'heart_rate', key: 'heart_rate' },
    { title: 'Давление', key: 'bp', render: (_, r) => `${r.systolic_pressure ?? '—'}/${r.diastolic_pressure ?? '—'}` },
    { title: 'Вес', dataIndex: 'body_weight', key: 'body_weight' },
    { title: 'Самочувствие', dataIndex: 'feeling', key: 'feeling' },
  ]

  const trainingCols = [
    { title: 'Дата', dataIndex: 'date', key: 'date', render: (v) => (v ? dayjs(v).format('DD.MM HH:mm') : '—') },
    { title: 'Длительность', dataIndex: 'duration_minutes', key: 'duration_minutes' },
    { title: 'Статус', dataIndex: 'status', key: 'status' },
    { title: 'Описание', dataIndex: 'description', key: 'description', ellipsis: true },
  ]

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card
        title="Отчёты тренера"
        extra={
          <Space wrap>
            <InputNumber min={1} value={athleteId} onChange={setAthleteId} placeholder="athleteId" />
            <DatePicker.RangePicker value={range} onChange={(v) => setRange(v)} allowClear={false} />
          </Space>
        }
      >
        <Typography.Paragraph type="secondary">
          Страница ожидает эндпоинт <code>/coach/reports</code>. Если у тебя другой маршрут — скажи, я подгоню.
        </Typography.Paragraph>
        {error && (
          <Typography.Text type="danger">{error?.message ?? 'Ошибка загрузки отчёта'}</Typography.Text>
        )}
      </Card>

      <Card title="Дневник спортсмена">
        <Table
          rowKey={(r) => r.id ?? `${r.date}-${r.heart_rate}`}
          columns={diaryCols}
          dataSource={diary}
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Card title="Тренировки спортсмена">
        <Table
          rowKey={(r) => r.id ?? `${r.date}-${r.duration_minutes}`}
          columns={trainingCols}
          dataSource={trainings}
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}
