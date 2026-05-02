import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getRequestByID } from '../api/requests';
import { toast } from 'react-toastify';

export default function RequestDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useContext(AuthContext);
  const [request, setRequest] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestID = params.get('id');

    if (!requestID) {
      toast.error('Нет ID заявки');
      navigate('/profile');
      return;
    }

    const fetchRequest = async () => {
      try {
        const res = await getRequestByID(requestID, token);
        setRequest(res.data.request);
      } catch (err) {
        console.error(err.response?.data || err);
        toast.error('Не удалось загрузить заявку');
        navigate('/profile');
      }
    };

    fetchRequest();
  }, [location.search, token, navigate]);

  if (!request) return <p>Загрузка заявки...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl mb-4">Заявка {request.id}</h2>
      <p><strong>Категория:</strong> {request.category}</p>
      <p><strong>Описание:</strong> {request.description}</p>
      <p><strong>Адрес:</strong> {request.address}</p>
      <p><strong>Приоритет:</strong> {request.priority}</p>
      <p><strong>Статус:</strong> {request.status}</p>
      <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-gray-300 rounded">
        Назад
      </button>
    </div>
  );
}
