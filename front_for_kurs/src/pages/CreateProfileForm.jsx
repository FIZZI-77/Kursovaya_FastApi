import React, { useState } from 'react'
import { createProfile } from '../api/user'
import { toast } from 'react-toastify'

export default function CreateProfileForm({ token, setProfile }) {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    try {
      const res = await createProfile(
        { full_name: fullName, phone, email },
        token
      )
      setProfile(res.data.user)
      toast.success('Профиль создан!')
    } catch (err) {
      console.error(err.response?.data || err)
      toast.error('Ошибка создания профиля')
    }
  }

  return (
    <form onSubmit={submit} className="max-w-md mx-auto mt-6 bg-white p-6 rounded shadow space-y-4">
      <input
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Имя"
        type="text"
        className="w-full p-2 border rounded"
        required
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Телефон"
        type="text"
        className="w-full p-2 border rounded"
        required
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        type="email"
        className="w-full p-2 border rounded"
        required
      />
      <button
        type="submit"
        className="w-full py-2 rounded bg-green-600 text-white hover:bg-green-700 transition"
      >
        Создать профиль
      </button>
    </form>
  )
}
