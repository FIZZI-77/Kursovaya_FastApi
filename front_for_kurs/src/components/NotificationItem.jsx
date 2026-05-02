import React from "react";
import { format } from "date-fns";

export default function NotificationItem({ event }) {
  // Приводим ключи к общему стилю
  const type = event.event_type || event.EventType || "Уведомление";
  const message = type.replace(/_/g, " "); // "user_ban_success" -> "user ban success"
  const timestamp = event.timestamp ? new Date(event.timestamp) : new Date();

  // Простая цветовая схема по типу события
  const color = message.includes("ban") ? "red" : message.includes("unban") ? "green" : "blue";

  return (
    <div className={`p-4 rounded shadow border-l-4 border-${color}-500 bg-white flex justify-between items-center`}>
      <div>
        <div className={`font-semibold text-${color}-700 capitalize`}>{message}</div>
        <div className="text-sm text-gray-500">
          {format(timestamp, "dd.MM.yyyy HH:mm:ss")}
        </div>
        <div className="text-xs text-gray-400">Источник: {event.origin}</div>
      </div>
    </div>
  );
}
