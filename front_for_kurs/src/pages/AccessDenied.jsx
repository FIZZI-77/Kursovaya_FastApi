import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AccessDenied.css'; 

export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="access-denied">
      <div className="particles"></div>
      <h1>Ошибка доступа</h1>
      <p>У вас нет прав для просмотра этой страницы.</p>
      <button onClick={() => navigate('/profile')}>
        Вернуться в профиль
      </button>
    </div>
  );
}
