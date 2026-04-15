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
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createSelfControlApi, listSelfControlsApi } from '../api/diary.api.js'
import { useNotify } from '../hooks/useNotify.js'

function normalizeList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  return []
}

export function DiaryPage() {
  const { msg } = useNotify()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [range, setRange] = useState([dayjs().subtract(14, 'day'), dayjs()])

  const { data, isLoading } = useQuery({
    queryKey: ['self-controls', range?.[0]?.format('YYYY-MM-DD'), range?.[1]?.format('YYYY-MM-DD')],
    queryFn: () =>
      listSelfControlsApi({
        from: range?.[0]?.format('YYYY-MM-DD'),
        to: range?.[1]?.format('YYYY-MM-DD'),
      }),
  })

  const items = useMemo(() => normalizeList(data), [data])

  const mutation = useMutation({
    mutationFn: (payload) => createSelfControlApi(payload),
    onSuccess: async () => {
      msg.success('Запись сохранена')
      setOpen(false)
      await qc.invalidateQueries({ queryKey: ['self-controls'] })
    },
    onError: (e) => msg.error(e?.message ?? 'Не удалось сохранить запись'),
  })

  const columns = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (v) => (v ? dayjs(v).format('DD.MM.YYYY HH:mm') : '—'),
    },
    { title: 'Пульс', dataIndex: 'heart_rate', key: 'heart_rate' },
    { title: 'Сист.', dataIndex: 'systolic_pressure', key: 'systolic_pressure' },
    { title: 'Диаст.', dataIndex: 'diastolic_pressure', key: 'diastolic_pressure' },
    { title: 'Вес', dataIndex: 'body_weight', key: 'body_weight' },
    { title: 'Самочувствие', dataIndex: 'feeling', key: 'feeling' },
    {
      title: 'Заметки',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
  ]

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card
        title="Дневник самоконтроля"
        extra={
          <Space>
            <DatePicker.RangePicker
              value={range}
              onChange={(v) => setRange(v)}
              allowClear={false}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
              Добавить
            </Button>
          </Space>
        }
      >
        <Typography.Paragraph type="secondary">
          Заполняйте дневник регулярно — это помогает тренеру контролировать нагрузку и ваше состояние.
        </Typography.Paragraph>

        <Table
          rowKey={(r) => r.id ?? `${r.date}-${r.heart_rate}`}
          columns={columns}
          dataSource={items}
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <DiaryCreateModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={(payload) => mutation.mutate(payload)}
        submitting={mutation.isPending}
      />
    </div>
  )
}

function DiaryCreateModal({ open, onClose, onSubmit, submitting }) {
  const [form] = Form.useForm()

  return (
    <Modal
      open={open}
      title="Новая запись"
      onCancel={onClose}
      okText="Сохранить"
      confirmLoading={submitting}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            const payload = {
              ...values,
              date: values.date?.toISOString?.() ?? values.date,
            }
            onSubmit(payload)
          })
          .catch(() => {})
      }}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{
          date: dayjs(),
          feeling: 7,
        }}
      >
        <Form.Item label="Дата" name="date" rules={[{ required: true, message: 'Укажите дату' }]}>
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          label="Пульс"
          name="heart_rate"
          rules={[{ required: true, message: 'Укажите пульс' }]}
        >
          <InputNumber min={0} max={250} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          label="Систолическое давление"
          name="systolic_pressure"
          rules={[{ required: true, message: 'Укажите систолическое давление' }]}
        >
          <InputNumber min={0} max={300} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          label="Диастолическое давление"
          name="diastolic_pressure"
          rules={[{ required: true, message: 'Укажите диастолическое давление' }]}
        >
          <InputNumber min={0} max={200} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Масса тела" name="body_weight"
        rules={[{ required: true, message: 'Укажите массу тела' }]}>
          <InputNumber min={0} max={200} step={0.1} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          label="Самочувствие (1–10)"
          name="feeling"
          rules={[{ required: true, message: 'Укажите самочувствие' }]}
        >
          <InputNumber min={1} max={10} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Заметки" name="description">
          <Input.TextArea rows={3} maxLength={1000} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
