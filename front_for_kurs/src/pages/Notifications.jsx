import React from "react";
import Navbar from "../components/Navbar";
import { useNotifications } from "../App.jsx";
import NotificationItem from "../components/NotificationItem";

export default function Notifications() {
  const events = useNotifications();

  return (
    <div>
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <h2 className="text-2xl mb-4">Уведомления</h2>
        <div className="space-y-2">
          {events.map((e, i) => (
            <NotificationItem key={i} event={e} />
          ))}
        </div>
      </div>
    </div>
  );
}
