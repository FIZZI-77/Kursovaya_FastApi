import { profileAPI } from './base'

// Получить список пользователей (админ)
export const getUserList = (filters = { page: 1, limit: 10, role: '', search: '' }) => {
  return profileAPI.get('/admin/users', filters)
}

// Забанить пользователя
export const banUser = (userId) => {
  return profileAPI.put('/admin/ban', { user_id: userId })
}

// Разбанить пользователя
export const unbanUser = (userId) => {
  return profileAPI.put('/admin/unban', { user_id: userId })
}

// Назначить роль worker
export const assignWorker = (userId) => {
  return profileAPI.put('/admin/assign-worker', { user_id: userId })
}

// Удалить роль worker
export const deleteWorker = (userId) => {
  return profileAPI.delete('/admin/worker', { data: { user_id: userId } })
}

// Создать новый навык
export const createSkill = (name) => {
  return profileAPI.post('/admin/skills', { name })
}
