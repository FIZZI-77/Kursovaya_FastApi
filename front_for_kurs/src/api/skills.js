// src/api/skills.js
import { profileAPI } from './base'

// Получить все доступные навыки из базы
export const getAllSkills = () => {
  return profileAPI.get('/skills')
}
