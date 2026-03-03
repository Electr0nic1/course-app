import React from 'react'
import { Button, Card, Form, Input, Typography } from 'antd'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { loginApi, getMeApi } from '../api/auth.api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useNotify } from '../hooks/useNotify.js'

export function LoginPage() {
  const [form] = Form.useForm()
  const { login } = useAuth()
  const { msg } = useNotify()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from ?? '/dashboard'

  const mutation = useMutation({
    mutationFn: async (values) => {
      // 1) login -> token
      const res = await loginApi(values)
      const token = res?.token
      if (!token) throw { message: 'Бэкенд не вернул token.' }

      // store token first (so /me works)
      localStorage.setItem('token', token)

      // 2) /me -> user (если бэкенд уже возвращает user — будет лишний запрос, но безопасно)
      const user = res?.user ?? (await getMeApi())
      return { token, user }
    },
    onSuccess: ({ token, user }) => {
      login({ token, user })
      msg.success('Вы успешно вошли')
      navigate(from, { replace: true })
    },
    onError: (e) => {
      msg.error(e?.message ?? 'Не удалось войти')
    },
  })

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <Card style={{ width: 420, maxWidth: '100%' }}>
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          Вход
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          Введите email и пароль, выданные администратором.
        </Typography.Paragraph>

        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => mutation.mutate(values)}
          requiredMark={false}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: 'Введите email' }, { type: 'email', message: 'Неверный формат email' }]}
          >
            <Input autoComplete="email" />
          </Form.Item>
          <Form.Item
            label="Пароль"
            name="password"
            rules={[{ required: true, message: 'Введите пароль' }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={mutation.isPending} block>
            Войти
          </Button>
        </Form>
      </Card>
    </div>
  )
}
