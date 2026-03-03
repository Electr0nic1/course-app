import React, { useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Button, Layout, Menu, Typography } from 'antd'
import {
  DashboardOutlined,
  CalendarOutlined,
  FileTextOutlined,
  TeamOutlined,
  LogoutOutlined,
  HeartOutlined,
} from '@ant-design/icons'
import { useAuth } from '../../context/AuthContext.jsx'
import { ROLE_LABELS } from '../../constants/roles.js'

const { Header, Sider, Content } = Layout

function useMenuItems(role) {
  return useMemo(() => {
    const items = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Панель',
      },
    ]

    if (role === 'athlete') {
      items.push(
        { key: '/diary', icon: <HeartOutlined />, label: 'Дневник' },
        { key: '/trainings', icon: <CalendarOutlined />, label: 'Тренировки' },
      )
    }

    if (role === 'coach') {
      items.push(
        { key: '/trainings', icon: <CalendarOutlined />, label: 'Тренировки' },
        { key: '/reports', icon: <FileTextOutlined />, label: 'Отчёты' },
      )
    }

    if (role === 'admin') {
      items.push(
        { key: '/admin/users', icon: <TeamOutlined />, label: 'Пользователи' },
      )
    }

    return items
  }, [role])
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const role = user?.role
  const items = useMenuItems(role)

  const selectedKey = items
    .map((i) => i.key)
    .sort((a, b) => b.length - a.length)
    .find((key) => location.pathname.startsWith(key))

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div style={{ padding: 16 }}>
          <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
            Athlete AИС
          </Typography.Title>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.75)' }}>
            {user?.full_name ?? 'Пользователь'}
          </Typography.Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          items={items}
          selectedKeys={selectedKey ? [selectedKey] : []}
          onClick={(e) => navigate(e.key)}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <Typography.Text style={{ color: '#fff' }}>
            Роль: <b>{ROLE_LABELS[role] ?? '—'}</b>
          </Typography.Text>
          <Button icon={<LogoutOutlined />} onClick={logout}>
            Выйти
          </Button>
        </Header>
        <Content style={{ padding: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
