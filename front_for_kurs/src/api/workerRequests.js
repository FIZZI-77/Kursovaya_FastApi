// src/api/workerRequests.js
import { requestAPI } from './base'

// =============================
// Запросы исполнителя
// =============================

// Доступные заявки
export const getAvailableRequests = (page = 1, pageSize = 5) =>
  requestAPI.get(`/worker/requests/available?page=${page}&pageSize=${pageSize}`)


// Принять заявку
export const acceptRequest = (requestId) => {
  return requestAPI.patch('/worker/requests/accept', { request_id: requestId })
}

// Завершить заявку
export const markRequestAsDone = (requestId) => {
  return requestAPI.patch('/worker/requests/done', { request_id: requestId })
}

// Список заявок исполнителя
export const getWorkerRequests = () => {
  return requestAPI.get('/worker/requests/list')
}
