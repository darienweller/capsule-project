'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CreateCapsulePage() {
    const { user, error, isLoading } = useUser();
    const router = useRouter();
    const [content, setContent] = useState('');
    const [timerDuration, setTimerDuration] = useState(20);
    const [message, setMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/api/auth/login'); // Redirect unauthenticated users
        }
    }, [user, isLoading]);

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;
    if (!user) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (timerDuration < 20 || timerDuration > 300) {
            setErrorMessage('Timer duration must be between 20 and 300 seconds.');
            return;
        }

        try {
            const res = await fetch('/api/capsules/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content, timerDuration }),
            });

            if (res.ok) {
                setMessage('Capsule created successfully!');
                setErrorMessage('');
                setContent('');
                setTimerDuration(20);
            } else {
                const errorData = await res.json();
                setMessage(`Error creating capsule: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setMessage('An unexpected error occurred.');
        }
    };

    return (
        <div className="create-capsule-page">
            <h1>Create a New Capsule</h1>
            <form onSubmit={handleSubmit} className="capsule-form">
                <div className="form-group">
                    <label htmlFor="content">Capsule Content:</label>
                    <textarea
                        id="content"
                        name="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="form-input no-resize tall-textarea"
                        placeholder="Write something meaningful..."
                        maxLength={200}
                        required
                    />
                    <p className="character-counter">{content.length}/200</p>
                </div>
                <div className="form-group">
                    <label htmlFor="timerDuration">Timer Duration (20-300 seconds):</label>
                    <input
                        id="timerDuration"
                        type="number"
                        value={timerDuration}
                        onChange={(e) => setTimerDuration(Number(e.target.value))}
                        className="form-input no-arrows"
                        min="20"
                        max="300"
                        required
                    />
                </div>
                <button type="submit" className="submit-button">Create Capsule</button>
            </form>
            {message && <p className="message success">{message}</p>}
            {errorMessage && <p className="message error">{errorMessage}</p>}
        </div>
    );
}
