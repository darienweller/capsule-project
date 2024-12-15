'use client';

import { useEffect, useState } from 'react';
import NotificationsList from './NotificationsList';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        async function fetchUser() {
            try {
                // Ensure cookies and same-origin mode so session cookies are sent
                const res = await fetch('/api/user', {
                    credentials: 'include',
                    mode: 'same-origin'
                });
                if (!res.ok) {
                    throw new Error('Failed to fetch user');
                }
                const userData = await res.json();
                setUserId(userData.id);
            } catch (err) {
                console.error('Error fetching user:', err);
                setError('Error fetching user data');
            }
        }

        fetchUser();
    }, []);

    useEffect(() => {
        async function fetchNotifications() {
            if (!userId) return;

            setLoading(true);
            setError(null);

            try {
                const res = await fetch(`/api/notifications?userId=${userId}`, {
                    credentials: 'include',
                    mode: 'same-origin'
                });
                if (!res.ok) {
                    throw new Error('Failed to fetch notifications');
                }
                const data = await res.json();
                setNotifications(data);
            } catch (err) {
                console.error('Error fetching notifications:', err);
                setError('Error fetching notifications');
            } finally {
                setLoading(false);
            }
        }

        fetchNotifications();
    }, [userId]);

    if (error) return <div>{error}</div>;
    if (!userId && !error) return <div>Loading user data...</div>;
    if (loading) return <div>Loading notifications...</div>;

    return (
        <div>
            <h1>Notifications</h1>
            <NotificationsList
                notifications={notifications}
                onNotificationsChange={setNotifications}
            />
        </div>
    );
}
