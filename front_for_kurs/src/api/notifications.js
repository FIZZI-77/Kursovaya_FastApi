import { useEffect, useRef } from "react";
import jwt_decode from "jwt-decode";

// Хардкодим URL WebSocket
const WS_URL = "ws://localhost:5000/ws";

export default function useWebSocket(onMessage) {
  const wsRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("❌ Нет токена, WebSocket не будет подключён");
      return;
    }

    // Декодируем JWT, чтобы получить userId
    let decoded;
    try {
      decoded = jwt_decode(token);
      console.log("JWT decoded:", decoded); // Для проверки
    } catch (err) {
      console.error("❌ Не удалось декодировать JWT:", err);
      return;
    }

    const userId = decoded.user_id || decoded.id || decoded.sub || decoded.userId;
    if (!userId) {
      console.error("❌ В токене нет userId — нужен user_id для WS!");
      return;
    }

    // Формируем URL с query-параметром
    const url = `${WS_URL}?user_id=${userId}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => console.log("WS подключён");
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch {
        onMessage(event.data);
      }
    };
    ws.onclose = () => console.log("WS закрыт");
    ws.onerror = (e) => console.log("WS ошибка:", e);

    // Закрываем WS при размонтировании компонента
    return () => {
      ws.close();
    };
  }, [onMessage]);
}
