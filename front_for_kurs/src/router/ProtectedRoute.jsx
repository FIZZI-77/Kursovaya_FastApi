import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export default function ProtectedRoute({ children, requiredRole }) {
  const { token, role } = useContext(AuthContext)

  if (!token) return <Navigate to="/login" replace />

  if (requiredRole && role !== requiredRole && role !== 'admin') {
    // admin имеет доступ ко всему
    return <Navigate to="/" replace />
  }

  return children
}
