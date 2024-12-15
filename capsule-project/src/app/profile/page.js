import { redirect } from 'next/navigation';
import { getSession } from '@auth0/nextjs-auth0/edge';
import prisma from '@/lib/prisma';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
    const session = await getSession();

    if (!session || !session.user) {
        // Redirect unauthenticated users to the login page
        redirect('/api/auth/login');
    }

    const auth0Id = session.user.sub;

    // Fetch user data from the database
    const user = await prisma.user.findUnique({
        where: { auth0Id },
    });

    if (!user) {
        // Handle case where user is not found
        return <div>User not found.</div>;
    }

    // Fetch all users excluding the current user
    const allUsers = await prisma.user.findMany({
        where: {
            id: {
                not: user.id,
            },
        },
        select: {
            id: true,
            email: true,
            bio: true,
        },
    });

    // Fetch user's friends
    const friends = await prisma.friend.findMany({
        where: {
            userId: user.id,
        },
        include: {
            friend: true,
        },
    });

    // Map friends to get friend user data
    const friendsList = friends.map((f) => ({
        id: f.friend.id,
        email: f.friend.email,
        bio: f.friend.bio,
    }));

    // Convert Date fields to strings
    const serializedUser = {
        ...user,
        createdAt: user.createdAt ? user.createdAt.toISOString() : null,
        profilePictureUrl: user.profilePictureUrl || null,
    };

    // Pass everything to the ProfileClient component
    return (
        <ProfileClient
            user={serializedUser}
            allUsers={allUsers}
            friendsList={friendsList}
        />
    );
}
