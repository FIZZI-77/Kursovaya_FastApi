import axios from 'axios'

const API_URL = 'http://localhost:7000' // адрес вашего User Service

// Получение профиля
export const getProfile = (token) =>
  axios.get(`${API_URL}/user/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  })

// Создание профиля
export const createProfile = (data, token) =>
  axios.post(`${API_URL}/user/profile`, data, {
    headers: { Authorization: `Bearer ${token}` }
  })

// Обновление профиля
export const updateProfile = (data, token) =>
  axios.put(`${API_URL}/user/profile`, data, {
    headers: { Authorization: `Bearer ${token}` }
  })
