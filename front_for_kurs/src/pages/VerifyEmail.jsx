import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../api/auth'; // создадим этот API вызов
import { toast } from 'react-toastify';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      return;
    }

    const confirmEmail = async () => {
      try {
        await verifyEmail(token);
        setStatus('success');
        toast.success('Почта успешно подтверждена!');
      } catch (err) {
        console.error(err.response?.data || err);
        setStatus('error');
        toast.error('Ошибка подтверждения почты');
      }
    };

    confirmEmail();
  }, [searchParams]);

  if (status === 'loading') return <p>Подтверждение почты...</p>;
  if (status === 'error') return <p>Ошибка подтверждения почты.</p>;
  if (status === 'success') return <p>Ваша почта успешно подтверждена!</p>;
}
