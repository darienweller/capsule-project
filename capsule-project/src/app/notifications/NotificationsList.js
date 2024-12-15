'use client';

import { useCallback } from 'react';

export default function NotificationsList({ notifications, onNotificationsChange }) {

    const markAsRead = useCallback(async (notificationId) => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId })
            });

            if (!res.ok) {
                throw new Error('Failed to mark notifications as read');
            }

            const updatedNotification = await res.json();

            // Update notifications state
            onNotificationsChange((prev) =>
                prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            );
        } catch (err) {
            console.error('Error marking notifications as read:', err);
        }
    }, [onNotificationsChange]);

    const handleFriendRequestAction = useCallback(async (notification, action) => {
        // notifications.senderId is the user who sent the friend request
        // notifications.userId is the one who received it (the current user)
        const { userId, senderId } = notification;

        try {
            // Accept or deny the friend request
            const res = await fetch('/api/friends', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    friendId: senderId,
                    action
                })
            });

            if (!res.ok) {
                throw new Error(`Failed to ${action} friend request`);
            }

            // After accepting/denying, mark the notifications as read
            await markAsRead(notification.id);
        } catch (err) {
            console.error(`Error handling friend request action (${action}):`, err);
        }
    }, [markAsRead]);

    // Sort notifications so unread are at the top
    const sortedNotifications = [...notifications].sort((a, b) => {
        if (a.isRead === b.isRead) {
            return new Date(b.createdAt) - new Date(a.createdAt); // Newest first
        }
        return a.isRead ? 1 : -1; // Unread first
    });

    return (
        <div>
            {sortedNotifications.length === 0 ? (
                <div>No notifications</div>
            ) : (
                <ul>
                    {sortedNotifications.map(notification => (
                        <li key={notification.id} style={{ border: '1px solid #ccc', margin: '8px 0', padding: '8px' }}>
                            <div><strong>Type:</strong> {notification.type}</div>
                            <div><strong>Message:</strong> {notification.message}</div>
                            <div><strong>From:</strong> {notification.sender ? notification.sender.email : 'System'}</div>
                            <div><strong>Read:</strong> {notification.isRead ? 'Yes' : 'No'}</div>

                            {!notification.isRead && (
                                <button onClick={() => markAsRead(notification.id)} style={{ marginRight: '8px' }}>
                                    Mark as Read
                                </button>
                            )}

                            {/* If it's a friend request notifications and not read yet, show accept/deny buttons */}
                            {notification.type === 'friend_request' && !notification.isRead && (
                                <>
                                    <button onClick={() => handleFriendRequestAction(notification, 'accept')} style={{ marginRight: '8px' }}>
                                        Accept
                                    </button>
                                    <button onClick={() => handleFriendRequestAction(notification, 'deny')}>
                                        Deny
                                    </button>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
