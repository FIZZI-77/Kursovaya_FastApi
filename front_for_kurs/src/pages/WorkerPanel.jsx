import React, { useEffect, useState, useContext } from 'react';
import Navbar from '../components/Navbar';
import {
  getAvailableRequests,
  acceptRequest,
  getWorkerRequests,
  markRequestAsDone,
} from '../api/workerRequests';
import {
  getWorkerProfile,
  getWorkerSkills,
  createWorkerProfile,
  addWorkerSkills,
} from '../api/worker';
import { updateWorkerProfile } from '../api/worker';
import { getAllSkills } from '../api/skills';
import { toast } from 'react-toastify';
import AccessDenied from './AccessDenied';
import '../styles/WorkerPanel.css';
import { AuthContext } from '../context/AuthContext';

export default function WorkerPanel() {
  const { role } = useContext(AuthContext);

  const [requests, setRequests] = useState([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [busyDoneId, setBusyDoneId] = useState(null);

  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [accessDenied, setAccessDenied] = useState(false);

  // Создание и редактирование профиля
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [allSkills, setAllSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);

  // Добавление навыков
  const [showAddSkills, setShowAddSkills] = useState(false);

  // Пагинация
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    if (role !== 'contractor') {
      setAccessDenied(true);
    } else {
      loadRequests();
      loadMyRequests();
      loadAllSkills();
    }
  }, [role, page]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const profileRes = await getWorkerProfile().catch(() => null);
      const skillRes = await getWorkerSkills().catch(() => []);
      setProfile(profileRes?.data || null);
      setSkills(Array.isArray(skillRes?.data) ? skillRes.data : []);

      const reqRes = await getAvailableRequests(page, pageSize);
      setRequests(Array.isArray(reqRes.data.data) ? reqRes.data.data : []);
      setTotalRequests(reqRes.data.total || 0);
    } catch (err) {
      if (err.response?.status === 403) setAccessDenied(true);
      else toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const loadMyRequests = async () => {
    try {
      const res = await getWorkerRequests();
      setMyRequests(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      toast.error('Ошибка загрузки ваших заявок');
    }
  };

  const loadAllSkills = async () => {
    try {
      const res = await getAllSkills();
      setAllSkills(res.data || []);
    } catch (err) {
      toast.error('Ошибка загрузки навыков');
    }
  };

  const take = async (id) => {
    setBusyId(id);
    try {
      await acceptRequest(id);
      toast.success('Заявка принята');
      loadRequests();
      loadMyRequests();
    } catch (err) {
      toast.error('Ошибка при принятии заявки');
    } finally {
      setBusyId(null);
    }
  };

  const finishRequest = async (id) => {
    setBusyDoneId(id);
    try {
      await markRequestAsDone(id);
      toast.success('Заявка завершена');
      setMyRequests((prev) => prev.filter((r) => r.id !== id));
      loadRequests();
    } catch (err) {
      toast.error('Ошибка при завершении заявки');
    } finally {
      setBusyDoneId(null);
    }
  };

  const handleCreateProfile = async () => {
    if (!newSpecialty.trim()) {
      toast.error('Укажите специальность');
      return;
    }
    try {
      await createWorkerProfile({
        specialty: newSpecialty,
        skills: selectedSkills,
      });
      toast.success('Профиль создан');
      setShowCreateForm(false);
      loadRequests();
      loadMyRequests();
    } catch (err) {
      toast.error('Ошибка при создании профиля');
    }
  };

  const handleAddSkills = async () => {
    if (!selectedSkills.length) {
      toast.error('Выберите хотя бы один навык');
      return;
    }
    try {
      await addWorkerSkills(selectedSkills);
      toast.success('Навыки добавлены');
      setSelectedSkills([]);
      setShowAddSkills(false);
      loadRequests();
      loadMyRequests();
    } catch (err) {
      toast.error('Ошибка при добавлении навыков');
    }
  };

  const handleUpdateSpecialty = async () => {
    if (!newSpecialty.trim()) {
      toast.error('Специальность не может быть пустой');
      return;
    }
    try {
      await updateWorkerProfile({ specialty: newSpecialty });
      toast.success('Специальность обновлена');
      setProfile((prev) => ({ ...prev, specialty: newSpecialty }));
      setEditingSpecialty(false);
    } catch (err) {
      toast.error('Ошибка при обновлении специальности');
    }
  };

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AccessDenied />
      </div>
    );
  }

  const totalPages = Math.ceil(totalRequests / pageSize);

  return (
    <div className="worker-panel-page">
      <Navbar />

      <div className="worker-panel-container">
        <h2 className="panel-title">Панель исполнителя</h2>

        {/* ПРОФИЛЬ */}
        {!profile ? (
          <div className="profile-warning">
            У вас нет профиля исполнителя. <b>Создайте его!</b>

            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-create-profile"
              >
                Создать профиль
              </button>
            ) : (
              <div className="create-profile-form">
                <input
                  type="text"
                  placeholder="Специальность"
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                />

                <select
                  multiple
                  value={selectedSkills}
                  onChange={(e) =>
                    setSelectedSkills(
                      Array.from(e.target.selectedOptions, (o) => Number(o.value))
                    )
                  }
                  className="skills-select"
                >
                  {allSkills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <div className="btn-row">
                  <button onClick={handleCreateProfile} className="btn-green">
                    Сохранить
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="btn-gray"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="profile-box">
            <div>
              <b>Специальность:</b>{' '}
              {!editingSpecialty ? (
                <>
                  {profile.specialty}{' '}
                  <button
                    onClick={() => {
                      setEditingSpecialty(true);
                      setNewSpecialty(profile.specialty);
                    }}
                    className="btn-edit"
                  >
                    Изменить
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                  />
                  <button onClick={handleUpdateSpecialty} className="btn-green">
                    Сохранить
                  </button>
                  <button
                    onClick={() => setEditingSpecialty(false)}
                    className="btn-gray"
                  >
                    Отмена
                  </button>
                </>
              )}
            </div>

            <div className="mt-1">
              <b>Навыки:</b> {skills.length ? skills.map((s) => s.name).join(', ') : 'нет'}
            </div>

            {/* Добавление навыков */}
            {!showCreateForm && (
              <div className="add-skills-section">
                {!showAddSkills ? (
                  <button
                    onClick={() => setShowAddSkills(true)}
                    className="btn-add-skill"
                  >
                    Добавить навык
                  </button>
                ) : (
                  <div className="add-skills-form">
                    <select
                      multiple
                      value={selectedSkills}
                      onChange={(e) =>
                        setSelectedSkills(
                          Array.from(e.target.selectedOptions, (o) => Number(o.value))
                        )
                      }
                      className="skills-select"
                    >
                      {allSkills.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <div className="btn-row">
                      <button onClick={handleAddSkills} className="btn-green">
                        Сохранить
                      </button>
                      <button
                        onClick={() => {
                          setShowAddSkills(false);
                          setSelectedSkills([]);
                        }}
                        className="btn-gray"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ДОСТУПНЫЕ ЗАЯВКИ */}
        <h3 className="section-title">Доступные заявки</h3>
        {loading ? (
          <div className="loading-text">Загрузка...</div>
        ) : requests.length === 0 ? (
          <div className="no-requests">Нет доступных заявок</div>
        ) : (
          <div className="requests-grid">
            {requests.map((r) => (
              <div key={r.id} className="request-card">
                <div className="request-row">
                  <span className="req-label">Категория:</span> {r.category}
                </div>
                <div className="request-row">
                  <span className="req-label">Адрес:</span> {r.address}
                </div>
                <div className="request-row">
                  <span className="req-label">Приоритет:</span>{' '}
                  <span className={`priority ${r.priority}`}>{r.priority}</span>
                </div>
                <div className="request-row">
                  <span className="req-label">Статус:</span> {r.status}
                </div>
                <div className="request-row">
                  <span className="req-label">Создано:</span>{' '}
                  {new Date(r.created_at).toLocaleString()}
                </div>

                {!r.worker_id && profile && (
                  <button
                    onClick={() => take(r.id)}
                    disabled={busyId === r.id}
                    className={`btn-take ${busyId === r.id ? 'disabled' : ''}`}
                  >
                    {busyId === r.id ? '...' : 'Взять'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ПАГИНАЦИЯ */}
        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="btn-page"
          >
            ← Назад
          </button>
          <span className="page-number">
            Страница {page} из {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="btn-page"
          >
            Вперёд →
          </button>
        </div>

        {/* МОИ ЗАЯВКИ */}
        <h3 className="section-title">Мои заявки</h3>
        {myRequests.length === 0 ? (
          <div className="no-requests">Вы ещё не взяли ни одной заявки</div>
        ) : (
          <div className="requests-grid">
            {myRequests.map((r) => (
              <div key={r.id} className="request-card">
                <div className="request-row">
                  <span className="req-label">Категория:</span> {r.category}
                </div>
                <div className="request-row">
                  <span className="req-label">Адрес:</span> {r.address}
                </div>
                <div className="request-row">
                  <span className="req-label">Приоритет:</span>{' '}
                  <span className={`priority ${r.priority}`}>{r.priority}</span>
                </div>
                <div className="request-row">
                  <span className="req-label">Статус:</span> {r.status}
                </div>
                <div className="request-row">
                  <span className="req-label">Создано:</span>{' '}
                  {new Date(r.created_at).toLocaleString()}
                </div>

                <button
                  onClick={() => finishRequest(r.id)}
                  disabled={busyDoneId === r.id}
                  className={`btn-finish ${busyDoneId === r.id ? 'disabled' : ''}`}
                >
                  {busyDoneId === r.id ? '...' : 'Завершить'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
