import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

const useSocket = () => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [notifications, setNotifications] = useState([]);

  // Load existing notifications from API
  useEffect(() => {
    if (!user) return;
    api.get("/notifications")
      .then(res => setNotifications(res.data.data || []))
      .catch(() => {});
  }, [user]);

  // Connect socket and listen for new notifications
  useEffect(() => {
    if (!user) return;

    socketRef.current = io(SOCKET_URL, { withCredentials: true });
    socketRef.current.emit("join", user.id);

    socketRef.current.on("notification:new", (notif) => {
      setNotifications(prev => [notif, ...prev]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = async (id) => {
    setNotifications(prev => prev.map(n => n._id === id || n.id === id ? { ...n, read: true } : n));
    try { await api.patch(`/notifications/${id}/read`); } catch {}
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try { await api.patch("/notifications/read-all"); } catch {}
  };

  return { notifications, unreadCount, markRead, markAllRead };
};

export default useSocket;
