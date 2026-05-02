import React from 'react'
import { Link } from 'react-router-dom'

export default function RequestCard({ req }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold">{req.title}</h3>
      <p className="text-sm">{req.short || req.description?.slice(0, 120)}</p>
      <div className="mt-2 flex justify-between items-center">
        <span className="text-gray-600 text-sm">Статус: {req.status}</span>
        <Link to={`/request/${req.id}`} className="text-blue-600">Открыть</Link>
      </div>
    </div>
  )
}
