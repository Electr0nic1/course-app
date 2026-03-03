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
  Tag
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTrainingApi,
  listAthleteTrainingsApi,
  listCoachTrainingsApi,
} from '../api/trainings.api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useNotify } from '../hooks/useNotify.js'
import { TRAINING_STATUS_LABELS } from '../constants/trainingStatus.js'

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
  const [range, setRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')])

  // Для тренера: простой фильтр по athleteId
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

      if (role === 'athlete') return listAthleteTrainingsApi(params)
      if (role === 'coach') return listCoachTrainingsApi({ ...params, athleteId: athleteId ?? undefined })
      return []
    },
  })

  const items = useMemo(() => normalizeList(data), [data])

  const createMutation = useMutation({
    mutationFn: (payload) => createTrainingApi(payload),
    onSuccess: async () => {
      msg.success('Тренировка создана')
      setOpen(false)
      await qc.invalidateQueries({ queryKey: ['trainings'] })
    },
    onError: (e) => msg.error(e?.message ?? 'Не удалось создать тренировку'),
  })

  const columns = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (v) => (v ? dayjs(v).format('DD.MM.YYYY HH:mm') : '—'),
    },
    { title: 'Длительность (мин)', dataIndex: 'duration_minutes', key: 'duration_minutes' },
    {
      title: 'Статус',
      key: 'status',
      render: (_, r) => {
        const s = TRAINING_STATUS_LABELS[r.status]
        if (!s) return '—'
        return <Tag color={s.color}>{s.label}</Tag>
      },
    },
    { title: 'Описание', dataIndex: 'description', key: 'description', ellipsis: true },
  ]

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card
        title="Тренировки"
        extra={
          <Space wrap>
            <DatePicker.RangePicker value={range} onChange={(v) => setRange(v)} allowClear={false} />
            {role === 'coach' && (
              <InputNumber
                min={1}
                placeholder="athleteId"
                value={athleteId}
                onChange={setAthleteId}
              />
            )}
            {role === 'coach' && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
                Создать
              </Button>
            )}
          </Space>
        }
      >
        <Typography.Paragraph type="secondary">
          {role === 'athlete'
            ? 'Здесь отображается ваш календарь тренировок.'
            : 'Тренер может просматривать и назначать тренировки спортсменам.'}
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
              athleteIds,
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
          rules={[{ required: true, message: 'Укажите хотя бы одного спортсмена' }]}
        >
          <Input placeholder="1,2,3" />
        </Form.Item>
        <Form.Item label="Дата" name="date" rules={[{ required: true, message: 'Укажите дату' }]}>
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          label="Длительность (мин)"
          name="duration_minutes"
          rules={[{ required: true, message: 'Укажите длительность' }]}
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
