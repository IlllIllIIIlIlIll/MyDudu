"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";

export interface Notification {
    id: number;
    type: string;
    message: string;
    status: string;
    createdAt: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    fetchNotifications: () => Promise<void>;
    markAllAsRead: () => Promise<void>;
    markAsRead: (id: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications?userId=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    const markAllAsRead = async () => {
        if (!user?.id) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/read-all?userId=${user.id}`, {
                method: 'PATCH'
            });
            if (res.ok) {
                fetchNotifications();
            }
        } catch (error) {
            console.error("Error marking all read", error);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${id}/read`, {
                method: 'PATCH'
            });
            if (res.ok) {
                fetchNotifications();
            }
        } catch (error) {
            console.error("Error marking read", error);
        }
    };

    // Initial fetch when user exists
    useEffect(() => {
        if (user?.id) {
            fetchNotifications();
            // Optional: Set up polling here if needed
            // const interval = setInterval(fetchNotifications, 30000);
            // return () => clearInterval(interval);
        }
    }, [user?.id]);

    const unreadCount = notifications.filter(n => n.status === 'SENT').length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, loading, fetchNotifications, markAllAsRead, markAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error("useNotification must be used within a NotificationProvider");
    return context;
};
