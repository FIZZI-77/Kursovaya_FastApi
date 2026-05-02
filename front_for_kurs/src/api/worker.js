import { profileAPI } from './base'

// =============================
// Профиль исполнителя
// =============================

// Получить профиль исполнителя
export const getWorkerProfile = () => {
  return profileAPI.get('/worker/profile')
}

// Создать профиль исполнителя
export const createWorkerProfile = (profile) => {
  return profileAPI.post('/worker/profile', profile)
}

// Обновить профиль исполнителя
export const updateWorkerProfile = (profile) => {
  return profileAPI.put('/worker/profile', profile)
}

// Удалить профиль исполнителя
export const deleteWorkerProfile = () => {
  return profileAPI.delete('/worker/profile')
}

// =============================
// Навыки исполнителя
// =============================

// Получить навыки
export const getWorkerSkills = () => {
  return profileAPI.get('/worker/skills')
}

// Добавить навыки
export const addWorkerSkills = (skillIds) => {
  return profileAPI.post('/worker/skills', { skill_ids: skillIds })
}

// Удалить навыки
export const removeWorkerSkills = (skillIds) => {
  return profileAPI.delete('/worker/skills', {
    data: { skill_ids: skillIds }
  })
}