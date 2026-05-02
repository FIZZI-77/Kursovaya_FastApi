import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import {
  getUserList,
  banUser,
  unbanUser,
  assignWorker,
  deleteWorker,
  createSkill
} from '../api/admin'
import { toast } from 'react-toastify'
import '../styles/AdminPanel.css'

export default function AdminPanel() {
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [role, setRole] = useState('')
  const [search, setSearch] = useState('')
  const [skillName, setSkillName] = useState('')
  const [loading, setLoading] = useState(true)

  // Загружаем список пользователей
  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await getUserList({
        page,
        limit,
        role: role || '',
        search: search || ''
      })

      if (!res.data || !Array.isArray(res.data.users)) {
        toast.error('Не удалось загрузить список пользователей')
        setUsers([])
        return
      }

      setUsers(res.data.users)
    } catch (err) {
      toast.error(`Ошибка загрузки пользователей: ${err.message}`)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  // Загружаем при изменении page, role, search
  useEffect(() => {
    loadUsers()
  }, [page, role, search])

  // Поиск
  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
  }

  // Действия: бан / разбан / worker
  const action = async (fn, userId, msgSuccess) => {
    try {
      await fn(userId)

      setUsers(prev =>
        prev.map(u => {
          if (u.id === userId) {
            if (fn === banUser || fn === unbanUser) {
              return { ...u, is_banned: !u.is_banned }
            }
            if (fn === assignWorker) {
              return { ...u, role: 'contractor' }
            }
            if (fn === deleteWorker) {
              return { ...u, role: 'user' }
            }
          }
          return u
        })
      )

      toast.success(msgSuccess)
    } catch (err) {
      toast.error(`Ошибка: ${err.message}`)
    }
  }

  // Создание навыка
  const submitSkill = async (e) => {
    e.preventDefault()
    try {
      await createSkill(skillName)
      setSkillName('')
      toast.success('Навык создан')
    } catch (err) {
      toast.error(`Ошибка создания навыка: ${err.message}`)
    }
  }

  return (
    <div className="admin-page">
      <Navbar />
      <div className="main-content">
        <div className="admin-card">
          <h2>Админская панель</h2>

          {/* Фильтры */}
          <form onSubmit={handleSearch}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по email / имени"
            />
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value)
                setPage(1)
              }}
            >
              <option value="">Все роли</option>
              <option value="user">User</option>
              <option value="contractor">Contractor</option>
              <option value="admin">Admin</option>
            </select>
            <button>Поиск</button>
          </form>

          {/* Создание навыка */}
          <form onSubmit={submitSkill}>
            <input
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="Название"
            />
            <button>Создать навык</button>
          </form>

          {/* Список пользователей */}
          {loading ? (
            <div>Загрузка...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Имя</th>
                  <th>Телефон</th>
                  <th>Роль</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.full_name}</td>
                    <td>{u.phone}</td>
                    <td>{u.role}</td>
                    <td>{u.is_banned ? 'Забанен' : 'Активен'}</td>
                    <td className="user-actions">
                      {!u.is_banned ? (
                        <button
                          className="ban"
                          onClick={() => action(banUser, u.id, 'Пользователь забанен')}
                        >
                          Бан
                        </button>
                      ) : (
                        <button
                          className="unban"
                          onClick={() => action(unbanUser, u.id, 'Пользователь разбанен')}
                        >
                          Разбан
                        </button>
                      )}

                      {u.role === 'user' && (
                        <button
                          className="assign"
                          onClick={() => action(assignWorker, u.id, 'Назначен рабочим')}
                        >
                          Сделать worker
                        </button>
                      )}
                      {u.role === 'contractor' && (
                        <button
                          className="delete"
                          onClick={() => action(deleteWorker, u.id, 'Рабочий удалён')}
                        >
                          Удалить worker
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Пагинация */}
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              Назад
            </button>
            <button onClick={() => setPage(page + 1)}>Далее</button>
          </div>
        </div>
      </div>
    </div>
  )
}
