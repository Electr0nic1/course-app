import React, { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import {
  Card,
  DatePicker,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Button,
  Modal,
  Descriptions,
} from 'antd'
import { listActivityLogsApi } from '../api/admin.api.js'

const { RangePicker } = DatePicker

function normalizeList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  return []
}

function safeJson(v) {
  if (v === null || v === undefined) return null
  if (typeof v === 'object') return v
  try {
    return JSON.parse(v)
  } catch {
    return v
  }
}

const ACTION_META = {
  created: { label: 'Создано', color: 'green' },
  updated: { label: 'Изменено', color: 'blue' },
  status_changed: { label: 'Статус изменён', color: 'orange' },
  deleted: { label: 'Удалено', color: 'red' },
}

const ENTITY_META = {
  training: { label: 'Тренировка', color: 'geekblue' },
  self_control: { label: 'Самоконтроль', color: 'purple' },
  user: { label: 'Пользователь', color: 'cyan' },
}

export function AdminActivityLogsPage() {
  // ===== Filters =====
  const [q, setQ] = useState('')
  const [entityType, setEntityType] = useState(undefined)
  const [action, setAction] = useState(undefined)
  const [range, setRange] = useState([dayjs().subtract(14, 'day'), dayjs()])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // ===== Details modal =====
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  const from = range?.[0]?.format('YYYY-MM-DD')
  const to = range?.[1]?.format('YYYY-MM-DD')

  const queryKey = useMemo(
    () => ['admin-activity-logs', page, pageSize, q, entityType ?? '-', action ?? '-', from ?? '-', to ?? '-'],
    [page, pageSize, q, entityType, action, from, to],
  )

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () =>
      listActivityLogsApi({
        page,
        per_page: pageSize,
        q: q || undefined,
        entity_type: entityType,
        action,
        from,
        to,
      }),
    keepPreviousData: true,
  })

  const items = useMemo(() => normalizeList(data), [data])

  const columns = [
    {
      title: 'Дата/время',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      sorter: (a, b) => dayjs(a.created_at).valueOf() - dayjs(b.created_at).valueOf(),
      defaultSortOrder: 'descend',
      render: (v) => (v ? dayjs(v).format('DD.MM.YYYY HH:mm:ss') : '—'),
    },
    {
      title: 'Действие',
      dataIndex: 'action',
      key: 'action',
      width: 150,
      filters: Object.keys(ACTION_META).map((k) => ({ text: ACTION_META[k].label, value: k })),
      onFilter: (val, r) => r.action === val,
      render: (v) => {
        const m = ACTION_META[v]
        return <Tag color={m?.color}>{m?.label ?? v ?? '—'}</Tag>
      },
    },
    {
      title: 'Сущность',
      dataIndex: 'entity_type',
      key: 'entity_type',
      width: 150,
      filters: Object.keys(ENTITY_META).map((k) => ({ text: ENTITY_META[k].label, value: k })),
      onFilter: (val, r) => r.entity_type === val,
      render: (v) => {
        const m = ENTITY_META[v]
        return <Tag color={m?.color}>{m?.label ?? v ?? '—'}</Tag>
      },
    },
    { title: 'Entity ID', dataIndex: 'entity_id', key: 'entity_id', width: 100 },
    {
      title: 'Кто сделал',
      key: 'actor',
      width: 220,
      render: (_, r) => {
        // ожидаем actor/actor_user или просто actor_user_id
        const actor = r.actor ?? r.actor_user ?? null
        if (actor?.full_name) return actor.full_name
        if (actor?.email) return actor.email
        if (r.actor_user_id) return `User #${r.actor_user_id}`
        return '—'
      },
    },
    {
      title: 'Meta',
      key: 'meta',
      ellipsis: true,
      render: (_, r) => {
        const meta = safeJson(r.meta)
        if (!meta) return '—'
        if (typeof meta === 'string') return meta
        // короткое превью
        const s = JSON.stringify(meta)
        return s.length > 120 ? `${s.slice(0, 120)}…` : s
      },
    },
    {
      title: 'Детали',
      key: 'details',
      width: 110,
      render: (_, r) => (
        <Button
          size="small"
          onClick={() => {
            setSelected(r)
            setOpen(true)
          }}
        >
          Открыть
        </Button>
      ),
    },
  ]

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card
        title="Логи активности"
        extra={
          <Space wrap>
            <Input
              allowClear
              placeholder="Поиск (например: training, status, id...)"
              value={q}
              onChange={(e) => {
                setPage(1)
                setQ(e.target.value)
              }}
              style={{ width: 260 }}
            />

            <Select
              allowClear
              placeholder="Сущность"
              value={entityType}
              onChange={(v) => {
                setPage(1)
                setEntityType(v)
              }}
              options={Object.entries(ENTITY_META).map(([value, m]) => ({
                value,
                label: m.label,
              }))}
              style={{ width: 180 }}
            />

            <Select
              allowClear
              placeholder="Действие"
              value={action}
              onChange={(v) => {
                setPage(1)
                setAction(v)
              }}
              options={Object.entries(ACTION_META).map(([value, m]) => ({
                value,
                label: m.label,
              }))}
              style={{ width: 180 }}
            />

            <RangePicker
              value={range}
              onChange={(v) => {
                setPage(1)
                setRange(v)
              }}
              allowClear={false}
            />
          </Space>
        }
      >
        {error && (
          <Typography.Text type="danger">
            {error?.message ?? 'Ошибка загрузки логов'}
          </Typography.Text>
        )}

        <Table
          rowKey={(r) => r.id}
          columns={columns}
          dataSource={items}
          loading={isLoading}
          pagination={{
            current: data?.current_page ?? page,
            pageSize: data?.per_page ?? pageSize,
            total: data?.total ?? items.length,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
        />
      </Card>

      <LogDetailsModal
        open={open}
        onClose={() => {
          setOpen(false)
          setSelected(null)
        }}
        log={selected}
      />
    </div>
  )
}

function LogDetailsModal({ open, onClose, log }) {
  const meta = safeJson(log?.meta)

  const actor = log?.actor ?? log?.actor_user ?? null
  const actorLabel =
    actor?.full_name ??
    actor?.email ??
    (log?.actor_user_id ? `User #${log.actor_user_id}` : '—')

  const entityLabel = ENTITY_META[log?.entity_type]?.label ?? log?.entity_type ?? '—'
  const actionLabel = ACTION_META[log?.action]?.label ?? log?.action ?? '—'

  return (
    <Modal
      open={open}
      title="Детали лога"
      onCancel={onClose}
      footer={<Button onClick={onClose}>Закрыть</Button>}
      width={820}
      destroyOnClose
    >
      {!log ? (
        <Typography.Text type="secondary">Нет данных</Typography.Text>
      ) : (
        <>
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="ID">{log.id ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Дата/время">
              {log.created_at ? dayjs(log.created_at).format('DD.MM.YYYY HH:mm:ss') : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Кто сделал">{actorLabel}</Descriptions.Item>
            <Descriptions.Item label="Сущность">{entityLabel}</Descriptions.Item>
            <Descriptions.Item label="Entity ID">{log.entity_id ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Действие">{actionLabel}</Descriptions.Item>
          </Descriptions>

          <div style={{ height: 12 }} />

          <Typography.Title level={5} style={{ marginTop: 0 }}>
            Meta
          </Typography.Title>
          <pre
            style={{
              margin: 0,
              padding: 12,
              background: '#0b0f19',
              color: '#e6edf3',
              borderRadius: 8,
              overflow: 'auto',
              maxHeight: 320,
              fontSize: 12,
              lineHeight: 1.4,
            }}
          >
            {meta ? JSON.stringify(meta, null, 2) : '—'}
          </pre>
        </>
      )}
    </Modal>
  )
}