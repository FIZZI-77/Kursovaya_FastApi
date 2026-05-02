import { authAPI } from './base';

export const register = (data) => authAPI.post('/auth/sign-up', data);

export const login = (data) => authAPI.post('/auth/sign-in', data);



// Запрос сброса пароля (отправка письма)
export const sendResetPasswordRequest = (data) => {
  return authAPI.post('/auth/sign-reset-password-request', data);
};

// Подтверждение нового пароля
export const confirmResetPassword = (data) => {
  return authAPI.post('/auth/sign-reset-password-confirm', data);
};

export const verifyEmail = (token) => {
  return authAPI.post('/auth/verify-email', { token });
};
