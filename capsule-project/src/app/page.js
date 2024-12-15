'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from "./page.module.css";

export default function Home() {
    const { user, error, isLoading } = useUser();
    const [recentPosts, setRecentPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [postsError, setPostsError] = useState(null);
    const [nextCapsule, setNextCapsule] = useState(null);
    const [countdown, setCountdown] = useState('');
    const router = useRouter();

    // Fetch recent posts from friends
    useEffect(() => {
        if (user) {
            const fetchRecentPosts = async () => {
                try {
                    const res = await fetch('/api/capsules/recent-friends');
                    if (res.ok) {
                        const data = await res.json();
                        setRecentPosts(data.recentPosts);
                    } else {
                        const errorData = await res.json();
                        setPostsError(errorData.error || 'Error fetching recent posts');
                    }
                } catch (error) {
                    console.error('Error fetching recent posts:', error);
                    setPostsError('An unexpected error occurred');
                } finally {
                    setLoadingPosts(false);
                }
            };

            const fetchNextCapsule = async () => {
                try {
                    const res = await fetch('/api/capsules/next');
                    if (res.ok) {
                        const data = await res.json();
                        setNextCapsule(data.nextCapsule);
                    }
                } catch (error) {
                    console.error('Error fetching next capsule:', error);
                }
            };

            fetchRecentPosts();
            fetchNextCapsule();
        }
    }, [user]);

    // Update countdown every second
    useEffect(() => {
        if (nextCapsule?.scheduledAt) {
            const updateCountdown = () => {
                const now = new Date();
                const revealTime = new Date(nextCapsule.scheduledAt);
                const diff = revealTime - now;

                if (diff <= 0) {
                    setCountdown('Revealing now!');
                } else {
                    const seconds = Math.floor((diff / 1000) % 60);
                    const minutes = Math.floor((diff / 1000 / 60) % 60);
                    const hours = Math.floor((diff / 1000 / 60 / 60));
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

                    setCountdown(
                        `${days > 0 ? `${days}d ` : ''}${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s`
                    );
                }
            };

            const intervalId = setInterval(updateCountdown, 1000);
            updateCountdown();

            return () => clearInterval(intervalId); // Clean up on unmount
        }
    }, [nextCapsule]);

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    const truncateContent = (content, limit) => {
        return content.length > limit ? `${content.substring(0, limit)}...` : content;
    };

    if (user) {
        return (
            <div className={styles.page}>
                <main className={styles.main}>
                    <h1>Welcome back, {user.name || user.email}!</h1>

                    <section className={styles.recentPosts}>
                        <h2>Recent Posts from Friends</h2>
                        {loadingPosts ? (
                            <p>Loading recent posts...</p>
                        ) : postsError ? (
                            <p style={{ color: 'red' }}>{postsError}</p>
                        ) : recentPosts.length > 0 ? (
                            <ul className={styles.postList}>
                                {recentPosts.map((post) => (
                                    <li
                                        key={post.id}
                                        className={styles.postItem}
                                        onClick={() => router.push('/feed')}
                                    >
                                        <div className={styles.userInfo}>
                                            <img
                                                src={post.user?.profilePictureUrl || '/default-profile.png'}
                                                alt={`${post.user?.email}'s profile`}
                                                className={styles.profilePicture}
                                            />
                                            <p><strong>{post.user?.email || 'Unknown User'}</strong></p>
                                        </div>
                                        <p>{truncateContent(post.content, 100)}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No recent posts to display.</p>
                        )}
                    </section>

                    <section className={styles.upcomingCapsule}>
                        <h2>Your Next Capsule</h2>
                        {nextCapsule ? (
                            <div
                                className={styles.capsuleCard}
                                onClick={() => router.push('/feed')}
                            >
                                <p><strong>Reveals In:</strong> {countdown}</p>
                                <p><strong>Content:</strong> {truncateContent(nextCapsule.content, 100)}</p>
                                <p><strong>Scheduled At:</strong> {new Date(nextCapsule.scheduledAt).toLocaleString()}</p>
                            </div>
                        ) : (
                            <p>No upcoming capsules scheduled.</p>
                        )}
                    </section>
                </main>
            </div>
        );
    } else {
        return (
            <div className={styles.page}>
                <main className={styles.main}>
                    <h1>Welcome to Capsule</h1>
                    <p>
                        Capsule is a web-based social media platform where you can create posts that are scheduled to appear at a future date.
                    </p>
                    <div className={styles.ctas}>
                        <a href="/api/auth/login" className={styles.primary}>Login</a>
                        <a href="/api/auth/login?screen_hint=signup" className={styles.secondary}>Create Account</a>
                    </div>
                </main>
            </div>
        );
    }
}
