import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import ruRU from 'antd/locale/ru_RU'

import dayjs from 'dayjs'
import 'dayjs/locale/ru'

import { router } from './app/router.jsx'
import './styles/index.css'

dayjs.locale('ru')

export default function App() {
  return (
    <ConfigProvider locale={ruRU}>
      <RouterProvider router={router} />
    </ConfigProvider>
  )
}