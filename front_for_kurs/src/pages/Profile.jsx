import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import { getProfile, createProfile, updateProfile } from '../api/user';
import { createRequest, getMyRequests } from '../api/requests';
import { sendResetPasswordRequest } from '../api/auth';
import { toast } from 'react-toastify';
import '../styles/Profile.css';

const PAGE_SIZE = 3;

export default function Profile() {
  const { token, setToken, role, setRole } = useContext(AuthContext);
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [creatingRequest, setCreatingRequest] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', email: '' });
  const [requests, setRequests] = useState([]);
  const [requestForm, setRequestForm] = useState({
    category: '',
    description: '',
    address: '',
    priority: 'low'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showResetEmailForm, setShowResetEmailForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        const res = await getProfile(token);
        setProfile(res.data);
        setForm({
          full_name: res.data.full_name || '',
          phone: res.data.phone || '',
          email: res.data.email || ''
        });
        setResetEmail(res.data.email || '');
        await fetchRequests(1);
      } catch (err) {
        if (err.response?.status === 404) setProfile(null);
        else toast.error('Ошибка загрузки профиля');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const fetchRequests = async (page = 1) => {
    try {
      const res = await getMyRequests({ page, page_size: PAGE_SIZE });
      setRequests(res.data.requests || []);
      setTotalPages(Math.ceil((res.data.total || 0) / PAGE_SIZE));
      setCurrentPage(page);
    } catch (err) {
      console.error(err.response?.data || err);
      setRequests([]);
      setTotalPages(1);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await createRequest(requestForm);
      toast.success('Заявка создана!');
      setCreatingRequest(false);
      setRequestForm({ category: '', description: '', address: '', priority: 'low' });
      await fetchRequests(1);
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error('Ошибка создания заявки');
    }
  };

  const openRequestDetail = async (requestID) => {
    try {
      const res = await fetch('http://localhost:3000/user/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ request_id: requestID })
      });
      if (!res.ok) throw new Error('Ошибка при получении заявки');
      const data = await res.json();
      setSelectedRequest(data.request);
    } catch (err) {
      console.error(err);
      toast.error('Не удалось загрузить заявку');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await createProfile(form, token);
      setProfile(res.data);
      toast.success('Профиль создан!');
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error('Ошибка создания профиля');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await updateProfile(form, token);
      setProfile(res.data);
      setEditing(false);
      toast.success('Профиль обновлён!');
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error('Ошибка обновления профиля');
    }
  };

  const handleResetRequest = async () => {
    try {
      await sendResetPasswordRequest({ email: resetEmail });
      toast.success('Проверьте почту для сброса пароля');
      setShowResetEmailForm(false);
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error('Ошибка запроса сброса пароля');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setRole(null);
    toast.info('Вы вышли из аккаунта');
    navigate('/login');
  };

  if (loading) return <p className="text-center mt-10 text-gray-600">Загрузка профиля...</p>;

  if (!profile) {
    return (
      <>
        <Navbar />
        <form onSubmit={handleCreate} className="profile-page">
          <div className="profile-card">
            <h2>Создание профиля</h2>
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Имя"
              required
            />
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
              type="email"
              required
            />
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Телефон"
            />
            <button type="submit" className="btn-create">Создать профиль</button>
          </div>
          <div className="circle-profile circle1"></div>
          <div className="circle-profile circle2"></div>
        </form>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="profile-page">
        <div className="profile-card">
          <h2>Профиль</h2>

          {editing ? (
            <form onSubmit={handleUpdate}>
              <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Имя" required />
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" required />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Телефон" />
              <div className="flex gap-4">
                <button type="submit" className="btn-edit">Сохранить</button>
                <button type="button" onClick={() => setEditing(false)} className="btn-delete">Отмена</button>
              </div>
            </form>
          ) : (
            <>
              <p><strong>Имя:</strong> {profile.full_name}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Телефон:</strong> {profile.phone}</p>

              <button onClick={() => setEditing(true)} className="btn-edit">Редактировать профиль</button>

              <button onClick={() => setShowResetEmailForm(!showResetEmailForm)} className="btn-delete">
                {showResetEmailForm ? 'Отмена сброса пароля' : 'Сбросить пароль'}
              </button>
              {showResetEmailForm && (
                <div className="mt-4">
                  <input value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="Email" type="email" />
                  <button onClick={handleResetRequest} className="btn-create">Отправить ссылку</button>
                </div>
              )}

              <button onClick={() => setCreatingRequest(!creatingRequest)} className="btn-create">
                {creatingRequest ? 'Отмена создания заявки' : 'Создать заявку'}
              </button>
              {creatingRequest && (
                <form onSubmit={handleCreateRequest} className="mt-4">
                  <input value={requestForm.category} onChange={(e) => setRequestForm({ ...requestForm, category: e.target.value })} placeholder="Категория" required />
                  <input value={requestForm.description} onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })} placeholder="Описание" required />
                  <input value={requestForm.address} onChange={(e) => setRequestForm({ ...requestForm, address: e.target.value })} placeholder="Адрес" required />
                  <select value={requestForm.priority} onChange={(e) => setRequestForm({ ...requestForm, priority: e.target.value })}>
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                  </select>
                  <button type="submit" className="btn-create">Создать заявку</button>
                </form>
              )}

              {/* Список заявок */}
              <div className="requests-list mt-6">
                <h3>Мои заявки</h3>
                <ul>
                  {requests.map((r) => (
                    <li
                      key={r.id}
                      className="mb-2 cursor-pointer text-blue-600 hover:underline"
                      onClick={() => openRequestDetail(r.id)}
                    >
                      <p><strong>Категория:</strong> {r.category}</p>
                      <p><strong>Статус:</strong> {r.status}</p>
                    </li>
                  ))}
                </ul>

                <div className="pagination flex justify-between mt-4">
                  <button disabled={currentPage === 1} onClick={() => fetchRequests(currentPage - 1)} className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50">Назад</button>
                  <span>Страница {currentPage} из {totalPages}</span>
                  <button disabled={currentPage === totalPages} onClick={() => fetchRequests(currentPage + 1)} className="px-4 py-2 bg-gray-300 rounded">Вперед</button>
                </div>
              </div>

              {/* Детали выбранной заявки */}
              {selectedRequest && (
                <div className="mt-6 p-6 bg-white shadow rounded border border-gray-300 relative">
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="absolute top-2 right-2 text-red-500 font-bold hover:text-red-700"
                  >
                    ✕
                  </button>
                  <h3 className="text-lg font-semibold mb-2">Детали заявки</h3>
                  <p><strong>Категория:</strong> {selectedRequest.category}</p>
                  <p><strong>Описание:</strong> {selectedRequest.description}</p>
                  <p><strong>Адрес:</strong> {selectedRequest.address}</p>
                  <p><strong>Приоритет:</strong> {selectedRequest.priority}</p>
                  <p><strong>Статус:</strong> {selectedRequest.status}</p>
                  {selectedRequest.photos?.length > 0 && (
                    <div className="mt-2">
                      <strong>Фото:</strong>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedRequest.photos.map((photo, idx) => (
                          <img key={idx} src={photo} alt={`photo-${idx}`} className="w-20 h-20 object-cover rounded border" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button onClick={handleLogout} className="btn-delete mt-4">Выйти</button>
            </>
          )}
        </div>
        <div className="circle-profile circle1"></div>
        <div className="circle-profile circle2"></div>
      </div>
    </>
  );
}
