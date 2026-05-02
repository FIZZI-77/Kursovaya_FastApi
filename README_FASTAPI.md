# Kursovaya FastAPI port

Проект переписан с Go/Gin на Python/FastAPI с сохранением микросервисной структуры:

- `Auth_Service` — регистрация, вход, выход, reset password, verify email, JWT + Redis.
- `User_Service` — профили пользователей, профили работников, навыки, admin/superadmin API.
- `Request_Service` — заявки пользователей, обработка работником, admin-операции.
- `Notification_Service` — WebSocket `/ws`, трансляция событий из Kafka.

## Запуск

```bash
docker compose -f docker-compose.local.yml up --build
```

Swagger UI FastAPI доступен напрямую:

- Auth: http://localhost:8000/docs
- Profile: http://localhost:7000/docs
- Request: http://localhost:3000/docs
- Notification health: http://localhost:5000/health

Nginx и frontend оставлены из исходного проекта.

## Что важно

1. Пути API сохранены близко к исходному Go-проекту.
2. Миграции SQL оставлены исходные, поэтому таблицы совместимы с прежней БД.
3. JWT подписывается HS256 тем же salt: `fsfjh2p9urhwpuenn`.
4. Google OAuth оставлен как placeholder, потому что в исходнике нужны реальные `CLIENT_ID` / `CLIENT_SECRET` и callback-настройки.
5. Email-отправка заменена на выдачу verification/reset token в ответе/API event, чтобы проект запускался локально без SMTP-настроек.
