import React, { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import {
  Card,
  DatePicker,
  Space,
  Table,
  Typography,
  Row,
  Col,
  Statistic,
  Select,
  Spin,
} from 'antd'
import { useQuery } from '@tanstack/react-query'
import { getCoachReportApi, listCoachAthletesApi } from '../api/reports.api.js'

function normalizeList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  return []
}

function toNumberOrNull(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const GENDER_LABEL = {
  male: 'Мужской',
  female: 'Женский',
}

function calcAge(birthDate) {
  if (!birthDate) return null
  const d = new Date(birthDate)
  if (Number.isNaN(d.getTime())) return null

  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1
  return age
}

export function ReportsPage() {
  const [selectedAthleteUserId, setSelectedAthleteUserId] = useState(null)
  const [range, setRange] = useState([dayjs().subtract(14, 'day'), dayjs()])

  const from = range?.[0]?.format('YYYY-MM-DD')
  const to = range?.[1]?.format('YYYY-MM-DD')

  // =========================
  // 1) список спортсменов тренера
  // =========================
  const athletesQuery = useQuery({
    queryKey: ['coach-athletes'],
    queryFn: () => listCoachAthletesApi({ page: 1, per_page: 200 }),
  })

  const athletesItems = useMemo(
    () => normalizeList(athletesQuery.data),
    [athletesQuery.data],
  )

  // select options: value = user_id (именно его ты используешь для отчётов)
  const athleteOptions = useMemo(() => {
    return athletesItems.map((a) => ({
      value: a.user_id,
      label: a?.user?.full_name
        ? `${a.user.full_name} (ID ${a.user_id})`
        : `ID ${a.user_id}`,
      meta: a,
    }))
  }, [athletesItems])

  // если ещё не выбран — выберем первого автоматически
  React.useEffect(() => {
    if (selectedAthleteUserId) return
    if (athleteOptions.length) setSelectedAthleteUserId(athleteOptions[0].value)
  }, [athleteOptions, selectedAthleteUserId])

  const selectedAthlete = useMemo(() => {
    return athletesItems.find((x) => x.user_id === selectedAthleteUserId) ?? null
  }, [athletesItems, selectedAthleteUserId])

  // =========================
  // 2) отчёт по выбранному спортсмену
  // =========================
  const reportQuery = useQuery({
    queryKey: ['coach-report', selectedAthleteUserId, from, to],
    queryFn: () =>
      getCoachReportApi({
        athlete_id: selectedAthleteUserId, // важно: user_id
        from,
        to,
      }),
    enabled: !!selectedAthleteUserId && !!from && !!to,
  })

  const report = reportQuery.data
  const stats = report?.stats ?? null
  const series = useMemo(() => normalizeList(report?.series), [report])

  const seriesCols = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (v) => (v ? dayjs(v).format('DD.MM.YYYY HH:mm') : '—'),
      sorter: (a, b) => dayjs(a?.date).valueOf() - dayjs(b?.date).valueOf(),
      defaultSortOrder: 'descend',
    },
    { title: 'Пульс', dataIndex: 'heart_rate', key: 'heart_rate', render: (v) => v ?? '—' },
    {
      title: 'Давление',
      key: 'bp',
      render: (_, r) => `${r?.systolic_pressure ?? '—'}/${r?.diastolic_pressure ?? '—'}`,
    },
    {
      title: 'Вес',
      dataIndex: 'body_weight',
      key: 'body_weight',
      render: (v) => {
        const n = toNumberOrNull(v)
        return n === null ? '—' : n
      },
    },
    { title: 'Самочувствие', dataIndex: 'feeling', key: 'feeling', render: (v) => v ?? '—' },
  ]

  const loadingTop = athletesQuery.isLoading
  const loadingReport = reportQuery.isLoading

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card
        title="Отчёты тренера"
        extra={
          <Space wrap>
            <Select
              style={{ minWidth: 320 }}
              loading={athletesQuery.isLoading}
              value={selectedAthleteUserId}
              onChange={setSelectedAthleteUserId}
              placeholder="Выберите спортсмена"
              options={athleteOptions}
              showSearch
              optionFilterProp="label"
            />
            <DatePicker.RangePicker
              value={range}
              onChange={(v) => setRange(v)}
              allowClear={false}
            />
          </Space>
        }
      >
        {loadingTop ? (
          <Spin />
        ) : athletesQuery.error ? (
          <Typography.Text type="danger">
            {athletesQuery.error?.message ?? 'Ошибка загрузки списка спортсменов'}
          </Typography.Text>
        ) : (
          <Space direction="vertical" size={4}>
            <Typography.Text type="secondary">
              Спортсмен:{' '}
              <b>{selectedAthlete?.user?.full_name ?? report?.athlete?.full_name ?? '—'}</b>
            </Typography.Text>
            <Typography.Text type="secondary">
              Период: <b>{report?.from ?? from ?? '—'}</b> — <b>{report?.to ?? to ?? '—'}</b>
            </Typography.Text>
          </Space>
        )}
      </Card>

      <Card title="Профиль спортсмена" loading={loadingTop}>
        {!selectedAthlete ? (
          <Typography.Text type="secondary">Выберите спортсмена</Typography.Text>
        ) : (
          <Row gutter={[16, 16]}>
            <Col xs={24} md={6}>
              <Statistic title="ID" value={selectedAthlete.user_id ?? '—'} />
            </Col>
            <Col xs={24} md={6}>
              <Statistic title="Email" value={selectedAthlete.user?.email ?? '—'} />
            </Col>
            <Col xs={24} md={6}>
              <Statistic
                title="Возраст"
                value={calcAge(selectedAthlete.user?.birth_date) ?? '—'}
              />
            </Col>
            <Col xs={24} md={6}>
              <Statistic
                title="Пол"
                value={GENDER_LABEL[selectedAthlete.user?.gender] ?? '—'}
              />
            </Col>
            <Col xs={24} md={6}>
              <Statistic
                title="Рост (см)"
                value={toNumberOrNull(selectedAthlete.height) ?? '—'}
              />
            </Col>
            <Col xs={24} md={6}>
              <Statistic
                title="Начальный вес (кг)"
                value={toNumberOrNull(selectedAthlete.initial_weight) ?? '—'}
              />
            </Col>
          </Row>
        )}
      </Card>

      <Card title="Сводка" loading={loadingReport}>
        {reportQuery.error ? (
          <Typography.Text type="danger">
            {reportQuery.error?.message ?? 'Ошибка загрузки отчёта'}
          </Typography.Text>
        ) : (
          <Row gutter={[16, 16]}>
            <Col xs={24} md={6}>
              <Statistic title="Записей" value={stats?.count ?? 0} loading={loadingReport} />
            </Col>
            <Col xs={24} md={6}>
              <Statistic title="Средний пульс" value={stats?.avg_heart_rate ?? '—'} loading={loadingReport} />
            </Col>
            <Col xs={24} md={6}>
              <Statistic
                title="Среднее давление"
                value={
                  stats
                    ? `${stats?.avg_systolic_pressure ?? '—'}/${stats?.avg_diastolic_pressure ?? '—'}`
                    : '—'
                }
                loading={loadingReport}
              />
            </Col>
            <Col xs={24} md={6}>
              <Statistic title="Средний вес" value={stats?.avg_body_weight ?? '—'} loading={loadingReport} />
            </Col>
            <Col xs={24} md={6}>
              <Statistic
                title="Среднее самочувствие"
                value={stats?.avg_feeling ?? '—'}
                suffix={stats?.avg_feeling != null ? '/10' : undefined}
                loading={loadingReport}
              />
            </Col>
          </Row>
        )}
      </Card>

      <Card title="Динамика самоконтроля">
        <Table
          rowKey={(r) => r.id ?? r.date ?? `${r.heart_rate}-${r.body_weight}-${r.feeling}`}
          columns={seriesCols}
          dataSource={series}
          loading={loadingReport}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}