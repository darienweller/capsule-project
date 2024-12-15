'use client';

import { useUser } from '@auth0/nextjs-auth0/client';

export default function ClientLayout({ children }) {
    const { user } = useUser();
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    return (
        <>
            <nav className="navbar">
                {user ? (
                    <ul>
                        <li className={currentPath === "/" ? "active" : ""}>
                            <a href="/">Home</a>
                        </li>
                        <li className={currentPath === "/profile" ? "active" : ""}>
                            <a href="/profile">Profile</a>
                        </li>
                        <li className={currentPath === "/create-capsule" ? "active" : ""}>
                            <a href="/create-capsule">Create Capsule</a>
                        </li>
                        <li className={currentPath === "/feed" ? "active" : ""}>
                            <a href="/feed">View Feed</a>
                        </li>
                        <li>
                            <a href="/api/auth/logout">Logout</a>
                        </li>
                        <li className={currentPath === "/notifications" ? "active" : ""}>
                            <a href="/notifications">Notifications</a>
                        </li>
                    </ul>
                ) : (
                    <ul>
                        <li>
                            <a href="/api/auth/login">Login</a>
                        </li>
                    </ul>
                )}
            </nav>
            <div className="page-container">{children}</div>
        </>
    );
}
