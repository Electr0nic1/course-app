import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router.jsx'
import './styles/index.css'

export default function App() {
  return <RouterProvider router={router} />
}
