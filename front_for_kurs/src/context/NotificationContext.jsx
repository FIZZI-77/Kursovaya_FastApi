// src/context/NotificationContext.jsx
import React, { createContext, useState } from "react";
import useWebSocket from "../hooks/useWebSocket";
import { toast } from "react-toastify";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [events, setEvents] = useState([]);

  useWebSocket((data) => {
    setEvents((prev) => [data, ...prev].slice(0, 50));

    // Всплывающее уведомление через toast
    toast.info(data.message || "Новое уведомление", {
      position: "top-right",
      autoClose: 5000,
    });
  });

  return (
    <NotificationContext.Provider value={{ events }}>
      {children}
    </NotificationContext.Provider>
  );
};
