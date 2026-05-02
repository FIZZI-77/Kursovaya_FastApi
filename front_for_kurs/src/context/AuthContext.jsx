import React, { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext({
  token: null,
  setToken: () => {},
  role: null,
  setRole: () => {},
})

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [role, setRole] = useState(localStorage.getItem('role') || null)

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }, [token])

  useEffect(() => {
    if (role) {
      localStorage.setItem('role', role)
    } else {
      localStorage.removeItem('role')
    }
  }, [role])

  return (
    <AuthContext.Provider value={{ token, setToken, role, setRole }}>
      {children}
    </AuthContext.Provider>
  )
}
