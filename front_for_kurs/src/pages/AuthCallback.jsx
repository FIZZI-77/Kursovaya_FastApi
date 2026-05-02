import React, { useEffect, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { AuthContext } from '../context/AuthContext'
import { createProfile } from '../api/user'
import jwt_decode from 'jwt-decode'

export default function AuthCallback() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setToken, setRole } = useContext(AuthContext)

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search)
        const token = params.get('token')
        const userId = params.get('user_id')
        const name = params.get('name')
        const email = params.get('email')

        if (!token) {
          toast.error('Ошибка авторизации через Google')
          return
        }

        // Сохраняем токен
        setToken(token)
        localStorage.setItem('token', token)

        // Получаем роль из JWT
        const decoded = jwt_decode(token)
        const role = decoded.role
        setRole(role)
        localStorage.setItem('role', role)

        toast.success('Вход через Google успешен!')

        // Создаём профиль, если ещё нет
        if (userId && name && email) {
          try {
            await createProfile({ user_id: userId, name, email }, token)
            toast.success('Профиль создан!')
          } catch (err) {
            console.warn('Профиль уже существует или ошибка создания:', err.response?.data || err)
          }
        }

        // Навигация в зависимости от роли
        navigate(role === 'admin' || role === 'superadmin' ? '/admin' : '/profile')
      } catch (err) {
        console.error(err.response?.data || err)
        toast.error('Ошибка авторизации через Google')
      }
    }

    handleGoogleCallback()
  }, [location, navigate, setToken, setRole])

  return (
    <div className="text-center mt-12">
      <p>Обрабатываем вход через Google...</p>
    </div>
  )
}
