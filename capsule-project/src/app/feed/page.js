'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function FeedPage() {
    const { user, error, isLoading } = useUser();
    const router = useRouter();

    const [capsules, setCapsules] = useState([]);
    const [loadingCapsules, setLoadingCapsules] = useState(true);
    const [capsulesError, setCapsulesError] = useState(null);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/api/auth/login');
        }
    }, [user, isLoading, router]);

    const fetchCapsules = async () => {
        try {
            const res = await fetch('/api/capsules');
            if (res.ok) {
                const data = await res.json();
                setCapsules(data.capsules);
            } else {
                const errorData = await res.json();
                setCapsulesError(errorData.error || 'Error fetching capsules');
            }
        } catch (error) {
            console.error('Error fetching capsules:', error);
            setCapsulesError('An unexpected error occurred');
        } finally {
            setLoadingCapsules(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchCapsules();

            const intervalId = setInterval(fetchCapsules, 1000); // Poll every second
            return () => clearInterval(intervalId);
        }
    }, [user]);

    // Calculate time remaining until the capsule is revealed
    const calculateTimeLeft = (scheduledAt) => {
        const now = new Date();
        const revealTime = new Date(scheduledAt);
        const diff = revealTime - now;

        if (diff <= 0) return null; // Reveal time has passed

        const seconds = Math.floor((diff / 1000) % 60);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const hours = Math.floor((diff / 1000 / 60 / 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        return `${days > 0 ? `${days}d ` : ''}${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s`;
    };

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;
    if (!user) return null;

    if (loadingCapsules) {
        return <div>Loading capsules...</div>;
    }

    if (capsulesError) {
        return <div>Error: {capsulesError}</div>;
    }

    if (capsules.length === 0) {
        return <div>Your feed is empty.</div>;
    }

    return (
        <div className="feed-page">
            <h1>Your Feed</h1>
            <div className="capsule-grid">
                {capsules.map((capsule) => {
                    const timeLeft = calculateTimeLeft(capsule.scheduledAt);

                    return (
                        <div key={capsule.id} className="capsule-card">
                            <div className="capsule-header">
                                <img
                                    src={capsule.user?.profilePictureUrl || '/default-profile.png'}
                                    alt={`${capsule.user?.email}'s profile`}
                                    className="profile-picture"
                                />
                                <p className="capsule-author">{capsule.user?.email || 'Unknown User'}</p>
                            </div>
                            {timeLeft ? (
                                <p className="capsule-timer">Reveals In: {timeLeft}</p>
                            ) : (
                                <p className="capsule-content">{capsule.content}</p>
                            )}
                            <div className="capsule-dates">
                                <span className="buried-date">
                                    Buried: {new Date(capsule.createdAt).toLocaleString()}
                                </span>
                                <span className="revealed-date">
                                    Revealed: {new Date(capsule.scheduledAt).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
