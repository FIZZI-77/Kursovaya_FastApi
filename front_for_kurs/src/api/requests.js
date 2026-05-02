import { requestAPI } from './base'

// Получить список заявок пользователя (POST с телом)
export const getMyRequests = (filters = { page: 1, page_size: 10 }) =>
  requestAPI.post('/user/requests/list', filters)

// Создать новую заявку
export const createRequest = (data) =>
  requestAPI.post('/user/requests', data)

// Получить конкретную заявку
export const getRequest = (id) =>
  requestAPI.get(`/user/request`, { params: { request_id: id } })

// Обновить статус заявки
export const updateRequestStatus = (id, data) =>
  requestAPI.put(`/user/request`, { request_id: id, ...data })

// Получить все заявки (только для админа)
export const getAllRequests = (filters = { page: 1, page_size: 10 }) =>
  requestAPI.post('/admin/requests/list', filters)


// requests.js
export const getRequestByID = (requestID, token) => {
  return authAPI.post(
    '/request',
    { request_id: requestID },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};
