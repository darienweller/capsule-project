'use client';

import { useState, useEffect } from 'react';

export default function ProfileClient({ user, allUsers, friendsList }) {
    const [bio, setBio] = useState(user.bio || '');
    const [profilePictureUrl, setProfilePictureUrl] = useState(user.profilePictureUrl || '');
    const [message, setMessage] = useState('');

    const [friends, setFriends] = useState(friendsList || []);
    const [users, setUsers] = useState([]);

    // Exclude friends from allUsers
    useEffect(() => {
        const friendIds = new Set(friendsList.map((friend) => friend.id));
        const filteredUsers = allUsers.filter((u) => !friendIds.has(u.id));
        setUsers(filteredUsers);
    }, [allUsers, friendsList]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const res = await fetch('/api/update-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bio, profile_picture_url: profilePictureUrl }),
        });

        if (res.ok) {
            setMessage('Profile updated successfully.');
        } else {
            const errorData = await res.json();
            setMessage(`Error updating profile: ${errorData.error}`);
        }
    };

    const handleAddFriend = async (friendId) => {
        try {
            const res = await fetch('/api/friends', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: user.id, friendId }),
            });

            if (res.ok) {
                const addedFriend = users.find((u) => u.id === friendId);
                setFriends([...friends, addedFriend]);
                setUsers(users.filter((u) => u.id !== friendId));
            } else {
                const errorData = await res.json();
                console.error(`Error adding friend: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error adding friend:', error);
        }
    };

    const handleRemoveFriend = async (friendId) => {
        try {
            const res = await fetch('/api/friends', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: user.id, friendId }),
            });

            if (res.ok) {
                const removedFriend = friends.find((f) => f.id === friendId);
                setUsers([...users, removedFriend]);
                setFriends(friends.filter((f) => f.id !== friendId));
            } else {
                const errorData = await res.json();
                console.error(`Error removing friend: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error removing friend:', error);
        }
    };

    return (
        <div className="profile-page">
            <h1>Welcome, {user.email}</h1>
            <section className="profile-section">
                <img
                    src={profilePictureUrl || '/default-profile.png'}
                    alt="Profile Picture"
                    className="profile-picture"
                />
                <div className="profile-info">
                    <p><strong>Account Created At:</strong> {new Date(user.createdAt).toLocaleString()}</p>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Bio:</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="bio-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>Profile Picture URL:</label>
                            <input
                                type="text"
                                value={profilePictureUrl}
                                onChange={(e) => setProfilePictureUrl(e.target.value)}
                                className="profile-picture-input"
                            />
                        </div>
                        <button type="submit" className="save-button">Update Profile</button>
                    </form>
                    {message && <p className="message">{message}</p>}
                </div>
            </section>
            <section className="friend-list-section">
                <h2>Your Friends</h2>
                {friends.length > 0 ? (
                    <ul className="friend-list">
                        {friends.map((friend) => (
                            <li key={friend.id} className="friend-item">
                                <p>{friend.email}</p>
                                <p>{friend.bio || 'No bio available.'}</p>
                                <button onClick={() => handleRemoveFriend(friend.id)} className="remove-button">
                                    Remove Friend
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>You have no friends yet.</p>
                )}
            </section>
            <section className="all-users-section">
                <h2>All Users</h2>
                {users.length > 0 ? (
                    <ul className="user-list">
                        {users.map((userItem) => (
                            <li key={userItem.id} className="user-item">
                                <p>{userItem.email}</p>
                                <p>{userItem.bio || 'No bio available.'}</p>
                                <button onClick={() => handleAddFriend(userItem.id)} className="add-button">
                                    Add Friend
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No other users to display.</p>
                )}
            </section>
        </div>
    );
}
