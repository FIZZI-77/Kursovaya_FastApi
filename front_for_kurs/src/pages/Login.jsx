import React, { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { login } from '../api/auth'
import { toast } from 'react-toastify'
import jwt_decode from 'jwt-decode'
import '../styles/Login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { setToken, setRole } = useContext(AuthContext)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    try {
      const res = await login({ email, password })
      const token = res.data.token

      setToken(token)
      localStorage.setItem('token', token)

      const decoded = jwt_decode(token)
      const role = decoded.role
      setRole(role)
      localStorage.setItem('role', role)

      toast.success('Вход выполнен')
      navigate(role === 'admin' || role === 'superadmin' ? '/admin' : '/profile')
    } catch (err) {
      toast.error('Ошибка входа')
      console.error(err.response?.data || err)
    }
  }

  const loginWithGoogle = () => {
    window.location.href = `${import.meta.env.VITE_AUTH_URL}/auth/google/login`
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Добро пожаловать</h2>
        <p className="subtitle">Введите свои данные для входа</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" className="login-btn" onClick={submit}>
          Войти
        </button>
        <button type="button" className="google-btn" onClick={loginWithGoogle}>
          Войти через Google
        </button>

        <p className="register-link">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>

      <div className="circle circle1"></div>
      <div className="circle circle2"></div>
    </div>
  )
}
