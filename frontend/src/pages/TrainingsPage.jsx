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
import { useAuth } from '../context/AuthContext.jsx'
import { useNotify } from '../hooks/useNotify.js'
import { TRAINING_STATUS } from '../constants/trainingStatus.js'
import { TRAINING_PARTICIPATION_STATUS } from '../constants/trainingParticipationStatus.js'

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
      msg.success('Статус участия обновлён')
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
              <InputNumber
                min={1}
                placeholder="athleteId"
                value={athleteId}
                onChange={setAthleteId}
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
        />
      )}
    </div>
  )
}

function CreateTrainingModal({ open, onClose, onSubmit, submitting }) {
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
              training_type_id: values.training_type_id ?? null,
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
        }}
      >
        <Form.Item
          label="Athlete IDs (через запятую)"
          name="athleteIds"
          rules={[
            {
              required: true,
              message: 'Укажите хотя бы одного спортсмена',
            },
          ]}
        >
          <Input placeholder="1,2,3" />
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

        <Form.Item label="Training type id" name="training_type_id">
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="Описание" name="description">
          <Input.TextArea rows={3} maxLength={512} />
        </Form.Item>
      </Form>
    </Modal>
  )
}