import React, { useMemo, useState } from 'react'
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  DatePicker
} from 'antd'
import dayjs from 'dayjs'
import { PlusOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createUserApi, deleteUserApi, listUsersApi, updateUserApi } from '../api/admin.api.js'
import { useNotify } from '../hooks/useNotify.js'

function normalizeList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  return []
}

const ROLE_OPTIONS = [
  { value: 3, label: 'Спортсмен' },
  { value: 2, label: 'Тренер' },
  { value: 1, label: 'Администратор' },
]

export function UsersPage() {
  const { msg } = useNotify()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => listUsersApi(),
  })

  const items = useMemo(() => normalizeList(data), [data])

  const createMutation = useMutation({
    mutationFn: (payload) => createUserApi(payload),
    onSuccess: async () => {
      msg.success('Пользователь создан')
      setOpen(false)
      await qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (e) => msg.error(e?.message ?? 'Не удалось создать пользователя'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateUserApi(id, payload),
    onSuccess: async () => {
      msg.success('Пользователь обновлён')
      setEditing(null)
      await qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (e) => msg.error(e?.message ?? 'Не удалось обновить пользователя'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteUserApi(id),
    onSuccess: async () => {
      msg.success('Пользователь удалён')
      await qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (e) => msg.error(e?.message ?? 'Не удалось удалить пользователя'),
  })

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'ФИО', dataIndex: 'full_name', key: 'full_name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Возраст', key: 'age', render: (_, r) => calcAge(r.birth_date) ?? '—' },
    { title: 'Пол', key: 'gender', render: (_, r) => GENDER_LABEL[r.gender] ?? '—' },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => setEditing(r)}>
            Изменить
          </Button>
          <Popconfirm
            title="Удалить пользователя?"
            okText="Удалить"
            cancelText="Отмена"
            onConfirm={() => deleteMutation.mutate(r.id)}
          >
            <Button size="small" danger loading={deleteMutation.isPending}>
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card
        title="Пользователи"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            Добавить
          </Button>
        }
      >
        <Table
          rowKey={(r) => r.id}
          columns={columns}
          dataSource={items}
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <UserModal
        open={open}
        title="Новый пользователь"
        okText="Создать"
        submitting={createMutation.isPending}
        onClose={() => setOpen(false)}
        onSubmit={(payload) => createMutation.mutate(payload)}
      />

      <UserModal
        open={!!editing}
        title="Редактирование"
        okText="Сохранить"
        submitting={updateMutation.isPending}
        initialValues={editing}
        onClose={() => setEditing(null)}
        onSubmit={(payload) => updateMutation.mutate({ id: editing.id, payload })}
      />
    </div>
  )
}

function UserModal({ open, title, okText, submitting, initialValues, onClose, onSubmit }) {
  const [form] = Form.useForm()
  const isEdit = !!initialValues?.id

  return (
    <Modal
      open={open}
      title={title}
      okText={okText}
      confirmLoading={submitting}
      onCancel={onClose}
      destroyOnClose
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            const payload = { ...values }

            if (payload.birth_date) {
              payload.birth_date = payload.birth_date.format('YYYY-MM-DD')
            }

            // пароль: при редактировании не отправляем пустой
            if (isEdit && !payload.password) delete payload.password

            // роль: при редактировании не отправляем вообще
            if (isEdit) delete payload.role_id

            onSubmit(payload)
          })
          .catch(() => { })
      }}
      afterOpenChange={(v) => {
        if (v) {
          const init = { ...(initialValues ?? {}) }
          if (init.birth_date) init.birth_date = dayjs(init.birth_date)
          form.setFieldsValue(init)
        } else {
          form.resetFields()
        }
      }}
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          label="ФИО"
          name="full_name"
          rules={[{ required: true, message: 'Укажите ФИО' }]}
        >
          <Input maxLength={150} />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Укажите email' },
            { type: 'email', message: 'Неверный email' },
          ]}
        >
          <Input maxLength={100} />
        </Form.Item>

        {!isEdit && (
          <Form.Item
            label="Роль"
            name="role_id"
            rules={[{ required: true, message: 'Укажите роль' }]}
          >
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
        )}

        <Form.Item
          label="Дата рождения"
          name="birth_date"
          rules={[{ required: true, message: 'Укажите дату рождения' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="Пол" name="gender">
          <Select
            options={[
              { value: 'male', label: 'Мужской' },
              { value: 'female', label: 'Женский' },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Пароль"
          name="password"
          rules={isEdit ? [] : [{ required: true, message: 'Укажите пароль' }]}
        >
          <Input.Password
            autoComplete="new-password"
            placeholder={isEdit ? 'Оставьте пустым, чтобы не менять' : ''}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export { UserModal }

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

const GENDER_LABEL = {
  male: 'Мужской',
  female: 'Женский'
}