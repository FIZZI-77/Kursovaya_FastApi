import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { confirmResetPassword } from '../api/auth';
import { toast } from 'react-toastify';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Получаем token и email из query-параметров
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('token');
    const e = params.get('email');

    if (!t || !e) {
      toast.error('Неверная ссылка для сброса пароля');
      navigate('/'); // Перенаправляем на главную
      return;
    }

    setToken(t);
    setEmail(e);
  }, [location.search, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await confirmResetPassword({ email, token, new_password: newPassword });
      toast.success('Пароль успешно изменён!');
      navigate('/login'); // перенаправляем на страницу входа
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error('Ошибка сброса пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold text-center mb-4">Сброс пароля</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          placeholder="Новый пароль"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          {loading ? 'Сохраняем...' : 'Сбросить пароль'}
        </button>
      </form>
    </div>
  );
}
