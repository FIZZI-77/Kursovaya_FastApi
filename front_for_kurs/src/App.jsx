// src/App.jsx
import React, { useEffect, useState, createContext, useContext, useRef } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'
import jwt_decode from 'jwt-decode'

import { AuthProvider, AuthContext } from './context/AuthContext'
import ProtectedRoute from './router/ProtectedRoute'
import Login from './pages/Login'
import WorkerPanel from './pages/WorkerPanel'
import AdminPanel from './pages/AdminPanel'
import Notifications from './pages/Notifications'
import Register from './pages/Register'
import AuthCallback from './pages/AuthCallback'
import Profile from './pages/Profile'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import RequestDetail from './pages/RequestDetail'
import AccessDenied from './pages/AccessDenied'

// ---------------- Notification Context ----------------
const NotificationContext = createContext([])

export function NotificationProvider({ children }) {
  const [events, setEvents] = useState([])
  const wsRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    let decoded
    try {
      decoded = jwt_decode(token)
    } catch {
      return
    }

    const userId = decoded.user_id || decoded.id || decoded.sub
    if (!userId) return

    const ws = new WebSocket(`ws://localhost:5000/ws?user_id=${userId}`)
    wsRef.current = ws

    ws.onopen = () => console.log('WS подключён')
    ws.onmessage = (event) => {
      let data
      try {
        data = JSON.parse(event.data)
      } catch {
        data = { message: event.data }
      }

      setEvents(prev => [data, ...prev].slice(0, 50))

      toast.info(data.message || 'Новое уведомление', {
        position: 'top-right',
        autoClose: 5000,
      })
    }
    ws.onclose = () => console.log('WS закрыт')
    ws.onerror = (err) => console.log('WS ошибка:', err)

    return () => ws.close()
  }, [])

  return (
    <NotificationContext.Provider value={events}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}

// ---------------- App Component ----------------
export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<RequireAuthRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/access-denied" element={<AccessDenied />} />

            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/worker-panel" element={<ProtectedRoute requiredRole="contractor"><WorkerPanel /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requiredRole={['admin', 'superadmin']}><AdminPanel /></ProtectedRoute>} />
            <Route path="/request/:id" element={<RequestDetail />} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <ToastContainer position="top-right" />
        </div>
      </NotificationProvider>
    </AuthProvider>
  )
}

// Редирект с корня
function RequireAuthRedirect() {
  const { token } = React.useContext(AuthContext)
  return token ? <Navigate to="/profile" /> : <Navigate to="/login" />
}
