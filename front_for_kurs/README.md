# Kurs Frontend

Шаблон фронтенда (React + Vite + Tailwind) для вашего проекта микросервисов.

Предполагаемые сервисы (по docker-compose):
- Auth Service: http://localhost:8000
- Profile Service: http://localhost:7000
- Request Service: http://localhost:3000
- Notification Service (WebSocket): ws://localhost:5000/ws

Как запустить:
1. `npm install`
2. `npm run dev`

Настройки API: в файлах `src/api/*` вы можете менять базовые URL под окружение.
