import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/auth'
import { AuthContext } from '../context/AuthContext'
import { toast } from 'react-toastify'
import '../styles/Register.css'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const { setToken } = useContext(AuthContext)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('Пароли не совпадают')
      return
    }

    try {
      const res = await register({ name, email, password })
      const token = res.data.token

      setToken(token)
      toast.success('Регистрация успешна!')
      navigate('/profile')
    } catch (err) {
      console.error(err.response?.data || err)
      if (err.response?.data?.error === 'user already exists') {
        toast.error('Пользователь с таким email уже существует')
      } else {
        toast.error('Ошибка регистрации')
      }
    }
  }

  return (
    <div className="register-background">
      <div className="register-bg-circle circle-a"></div>
      <div className="register-bg-circle circle-b"></div>
      <form onSubmit={submit} className="register-card">
        <h2>Регистрация</h2>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Имя"
          type="text"
          required
        />

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          required
        />

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          type="password"
          required
        />

        <input
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Повторите пароль"
          type="password"
          required
        />

        <button type="submit">Зарегистрироваться</button>

        <div className="login-text">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </div>
      </form>
    </div>
  )
}
