import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout.jsx'
import { RequireAuth, RequireRole } from './routerGuards.jsx'

import { LoginPage } from '../pages/LoginPage.jsx'
import { DashboardPage } from '../pages/DashboardPage.jsx'
import { DiaryPage } from '../pages/DiaryPage.jsx'
import { TrainingsPage } from '../pages/TrainingsPage.jsx'
import { ReportsPage } from '../pages/ReportsPage.jsx'
import { UsersPage } from '../pages/UsersPage.jsx'
import { UnauthorizedPage } from '../pages/UnauthorizedPage.jsx'
import { NotFoundPage } from '../pages/NotFoundPage.jsx'

import { PublicOnlyRoute } from '../components/PublicOnlyRoute.jsx'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      {
        path: 'diary',
        element: (
          <RequireRole allow={['athlete']}>
            <DiaryPage />
          </RequireRole>
        ),
      },
      {
        path: 'trainings',
        element: (
          <RequireRole allow={['athlete', 'coach']}>
            <TrainingsPage />
          </RequireRole>
        ),
      },
      {
        path: 'reports',
        element: (
          <RequireRole allow={['coach']}>
            <ReportsPage />
          </RequireRole>
        ),
      },
      {
        path: 'admin/users',
        element: (
          <RequireRole allow={['admin']}>
            <UsersPage />
          </RequireRole>
        ),
      },
      { path: 'unauthorized', element: <UnauthorizedPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
