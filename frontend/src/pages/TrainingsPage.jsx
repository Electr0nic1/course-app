import React, { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Table,
  Typography,
  Tag,
  Select,
  Spin,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTrainingApi,
  assignTrainingApi,
  listAthleteTrainingsApi,
  listCoachTrainingsApi,
  updateTrainingStatusApi,
  updateAthleteTrainingStatusApi,
} from '../api/trainings.api.js'
import { listCoachAthletesApi } from '../api/reports.api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useNotify } from '../hooks/useNotify.js'
import { TRAINING_STATUS } from '../constants/trainingStatus.js'
import { TRAINING_PARTICIPATION_STATUS } from '../constants/trainingParticipationStatus.js'
import { TRAINING_TYPES } from '../constants/trainingTypes.js'

const { RangePicker } = DatePicker

function normalizeList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  return []
}

export function TrainingsPage() {
  const { user } = useAuth()
  const { msg } = useNotify()
  const qc = useQueryClient()

  const role = user?.role
  const [open, setOpen] = useState(false)
  const [range, setRange] = useState([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ])
  const [athleteId, setAthleteId] = useState(null)

  const athletesQuery = useQuery({
    queryKey: ['coach-athletes'],
    queryFn: () => listCoachAthletesApi({ page: 1, per_page: 200 }),
    enabled: role === 'coach',
  })

  const athletesItems = useMemo(
    () => normalizeList(athletesQuery.data),
    [athletesQuery.data],
  )

  const athleteOptions = useMemo(() => {
    return athletesItems.map((a) => ({
      value: a.user_id,
      label: a?.user?.full_name
        ? `${a.user.full_name} (ID ${a.user_id})`
        : `ID ${a.user_id}`,
    }))
  }, [athletesItems])

  const queryKey = useMemo(
    () => [
      'trainings',
      role,
      athleteId ?? 'me',
      range?.[0]?.format('YYYY-MM-DD'),
      range?.[1]?.format('YYYY-MM-DD'),
    ],
    [role, athleteId, range],
  )

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => {
      const params = {
        from: range?.[0]?.format('YYYY-MM-DD'),
        to: range?.[1]?.format('YYYY-MM-DD'),
      }

      if (role === 'athlete') {
        return listAthleteTrainingsApi(params)
      }

      if (role === 'coach') {
        return listCoachTrainingsApi({
          ...params,
          athleteId: athleteId ?? undefined,
        })
      }

      return []
    },
    enabled: !!role,
  })

  React.useEffect(() => {
    if (role !== 'coach') return
    if (athleteId) return

    if (athleteOptions.length) {
      setAthleteId(athleteOptions[0].value)
    }
  }, [role, athleteOptions, athleteId])

  const items = useMemo(() => normalizeList(data), [data])

  // Создание тренировки + назначение спортсменов
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { athleteIds, ...trainingPayload } = payload

      const createdTraining = await createTrainingApi(trainingPayload)

      // Поддержка разных форматов ответа бэка
      const trainingId =
        createdTraining?.id ??
        createdTraining?.data?.id ??
        createdTraining?.training?.id

      if (!trainingId) {
        throw new Error('Не удалось получить id созданной тренировки')
      }

      if (Array.isArray(athleteIds) && athleteIds.length > 0) {
        await assignTrainingApi(trainingId, athleteIds)
      }

      return createdTraining
    },
    onSuccess: async () => {
      msg.success('Тренировка создана и назначена спортсменам')
      setOpen(false)
      await qc.invalidateQueries({ queryKey: ['trainings'] })
    },
    onError: (e) => {
      msg.error(e?.message ?? 'Не удалось создать тренировку')
    },
  })

  // Для тренера: меняет статус самой тренировки
  const coachStatusMutation = useMutation({
    mutationFn: ({ id, status }) => updateTrainingStatusApi(id, status),
    onSuccess: async () => {
      msg.success('Статус тренировки обновлён')
      await qc.invalidateQueries({ queryKey: ['trainings'] })
    },
    onError: (e) => {
      msg.error(e?.message ?? 'Не удалось обновить статус тренировки')
    },
  })

  // Для спортсмена: меняет статус участия в pivot
  const athleteStatusMutation = useMutation({
    mutationFn: ({ id, status }) => updateAthleteTrainingStatusApi(id, status),
    onSuccess: async () => {
      msg.success('Статус участия обновлён', 100)
      await qc.invalidateQueries({ queryKey: ['trainings'] })
    },
    onError: (e) => {
      msg.error(e?.message ?? 'Не удалось обновить статус участия')
    },
  })

  const statusConfig =
    role === 'athlete' ? TRAINING_PARTICIPATION_STATUS : TRAINING_STATUS

  const statusFilters = Object.entries(statusConfig).map(([value, meta]) => ({
    text: meta.label,
    value,
  }))

  const columns = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
      render: (v) => (v ? dayjs(v).format('DD.MM.YYYY HH:mm') : '—'),
    },
    {
      title: 'Длительность (мин)',
      dataIndex: 'duration_minutes',
      key: 'duration_minutes',
    },
    {
      title: 'Тип',
      dataIndex: 'training_type_id',
      key: 'training_type_id',
      render: (typeId) => {
        const type = Object.values(TRAINING_TYPES).find(
          (x) => x.id === typeId,
        )

        return (
          <Tag>
            {type?.label ?? '—'}
          </Tag>
        )
      },
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      filters: statusFilters,
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <Tag color={statusConfig[status]?.color}>
          {statusConfig[status]?.label ?? status}
        </Tag>
      ),
    },
    // {
    //   title: 'Спортсмены',
    //   key: 'athletes',
    //   render: (_, record) => {
    //     const athletes = record.athletes ?? []

    //     if (!athletes.length) {
    //       return '—'
    //     }

    //     return (
    //       <Space wrap>
    //         {athletes.map((athlete) => (
    //           <Tag key={athlete.id}>
    //             {athlete?.user?.full_name ?? `ID ${athlete.id}`}
    //           </Tag>
    //         ))}
    //       </Space>
    //     )
    //   },
    // },
    ...(role === 'coach'
      ? [{
        title: 'Выполнение',
        key: 'progress',
        width: 320,
        render: (_, record) => {
          const athletes = record.athletes ?? []

          if (!athletes.length) return '—'

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {athletes.map((athlete) => {
                const status = athlete?.pivot?.status

                const config = {
                  completed: {
                    color: 'green',
                    label: 'Выполнил',
                  },
                  skipped: {
                    color: 'red',
                    label: 'Пропустил',
                  },
                  assigned: {
                    color: 'blue',
                    label: 'Назначено',
                  },
                }

                const current = config[status] ?? {
                  color: 'default',
                  label: status ?? '—',
                }

                return (
                  <Tag
                    color={current.color}
                    key={athlete.id}
                    style={{
                      width: 'fit-content',
                      margin: 0,
                    }}
                  >
                    {athlete?.user?.full_name ?? `ID ${athlete.id}`} — {current.label}
                  </Tag>
                )
              })}
            </div>
          )
        },
      }]
      : []),
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (v) => v ?? '—',
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, r) => {
        if (role === 'coach') {
          return (
            <Space>
              <Button
                size="small"
                type="primary"
                onClick={() =>
                  coachStatusMutation.mutate({
                    id: r.id,
                    status: 'done',
                  })
                }
                disabled={r.status === 'done'}
                loading={coachStatusMutation.isPending}
              >
                Проведена
              </Button>

              <Button
                size="small"
                danger
                onClick={() =>
                  coachStatusMutation.mutate({
                    id: r.id,
                    status: 'canceled',
                  })
                }
                disabled={r.status === 'canceled'}
                loading={coachStatusMutation.isPending}
              >
                Отменить
              </Button>
            </Space>
          )
        }

        if (role === 'athlete') {
          return (
            <Space>
              <Button
                size="small"
                type="primary"
                onClick={() =>
                  athleteStatusMutation.mutate({
                    id: r.id,
                    status: 'completed',
                  })
                }
                disabled={r.status === 'completed' || r.status === 'skipped'}
                loading={athleteStatusMutation.isPending}
              >
                Выполнена
              </Button>

              <Button
                size="small"
                danger
                onClick={() =>
                  athleteStatusMutation.mutate({
                    id: r.id,
                    status: 'skipped',
                  })
                }
                disabled={r.status === 'completed' || r.status === 'skipped'}
                loading={athleteStatusMutation.isPending}
              >
                Пропущена
              </Button>
            </Space>
          )
        }

        return '—'
      },
    },
  ]

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card
        title="Тренировки"
        extra={
          <Space wrap>
            <RangePicker
              value={range}
              onChange={(v) => setRange(v)}
              allowClear={false}
            />

            {role === 'coach' && (
              <Select
                style={{ minWidth: 320 }}
                loading={athletesQuery.isLoading}
                value={athleteId}
                onChange={setAthleteId}
                placeholder="Выберите спортсмена"
                options={athleteOptions}
                showSearch
                optionFilterProp="label"
                allowClear
              />
            )}

            {role === 'coach' && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setOpen(true)}
              >
                Создать
              </Button>
            )}
          </Space>
        }
      >
        <Typography.Paragraph type="secondary">
          {role === 'athlete'
            ? 'Здесь отображаются назначенные вам тренировки и статус их выполнения.'
            : 'Тренер может просматривать и назначать тренировки спортсменам, а также изменять статус самой тренировки.'}
        </Typography.Paragraph>

        <Table
          rowKey={(r) => r.id ?? `${r.date}-${r.duration_minutes}`}
          columns={columns}
          dataSource={items}
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {role === 'coach' && (
        <CreateTrainingModal
          open={open}
          onClose={() => setOpen(false)}
          submitting={createMutation.isPending}
          onSubmit={(payload) => createMutation.mutate(payload)}
          athleteOptions={athleteOptions}
        />
      )}
    </div>
  )
}

function CreateTrainingModal({ open, onClose, onSubmit, submitting, athleteOptions }) {
  const [form] = Form.useForm()

  return (
    <Modal
      open={open}
      title="Создать тренировку"
      onCancel={onClose}
      okText="Сохранить"
      confirmLoading={submitting}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            const athleteIds = String(values.athleteIds)
              .split(',')
              .map((x) => x.trim())
              .filter(Boolean)
              .map((x) => Number(x))
              .filter((x) => Number.isFinite(x))

            onSubmit({
              athlete_ids: athleteIds,
              date: values.date?.toISOString?.() ?? values.date,
              duration_minutes: values.duration_minutes,
              description: values.description,
              training_type_id: TRAINING_TYPES[values.training_type]?.id ?? null,
            })
          })
          .catch(() => { })
      }}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{
          date: dayjs(),
          duration_minutes: 60,
          training_type: 'cardio',
        }}
      >
        <Form.Item
          label="Спортсмены"
          name="athleteIds"
          rules={[
            {
              required: true,
              message: 'Выберите хотя бы одного спортсмена',
            },
          ]}
        >
          <Select
            mode="multiple"
            placeholder="Выберите спортсменов"
            options={athleteOptions}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          label="Дата"
          name="date"
          rules={[
            {
              required: true,
              message: 'Укажите дату',
            },
          ]}
        >
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="Длительность (мин)"
          name="duration_minutes"
          rules={[
            {
              required: true,
              message: 'Укажите длительность',
            },
          ]}
        >
          <InputNumber min={1} max={600} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          label="Тип тренировки"
          name="training_type"
          rules={[
            {
              required: true,
              message: 'Выберите тип тренировки',
            },
          ]}
        >
          <Select
            placeholder="Выберите тип"
            options={Object.entries(TRAINING_TYPES).map(
              ([value, meta]) => ({
                value,
                label: meta.label,
              }),
            )}
          />
        </Form.Item>
        <Form.Item label="Описание" name="description">
          <Input.TextArea rows={3} maxLength={512} />
        </Form.Item>
      </Form>
    </Modal>
  )
}