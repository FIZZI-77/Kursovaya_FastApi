// useWebSocket.js
import { useEffect, useRef } from "react";
import jwt_decode from "jwt-decode";

// Хардкодим URL WebSocket прямо здесь
const WS_URL = "https://localhost/api/notification"; // обязательно ws://, а не http://

export default function useWebSocket(onMessage) {
  const wsRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("❌ Нет токена, WebSocket не будет подключён");
      return;
    }

    let decoded;
    try {
      decoded = jwt_decode(token);
      console.log("JWT decoded:", decoded);
    } catch (err) {
      console.error("❌ Не удалось декодировать JWT:", err);
      return;
    }

    const userId = decoded.user_id || decoded.id || decoded.sub || decoded.userId;
    if (!userId) {
      console.error("❌ В токене нет userId");
      return;
    }

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

    return () => ws.close();
  }, [onMessage]);
}
