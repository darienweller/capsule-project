import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';
import prisma from '../../../lib/prisma';

export async function GET(request) {
    try {
        // Get the user session
        const session = await getSession(request);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const auth0Id = session.user.sub;

        // Find the user in the database
        const user = await prisma.user.findUnique({
            where: { auth0Id },
            select: {
                id: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Fetch the user's friends' IDs
        const friends = await prisma.friend.findMany({
            where: { userId: user.id },
            select: { friendId: true },
        });

        const friendIds = friends.map(friend => friend.friendId);

        // Include the current user's ID in the list
        const userAndFriendIds = [user.id, ...friendIds];

        // Fetch capsules from the user and their friends
        const capsules = await prisma.capsule.findMany({
            where: {
                userId: {
                    in: userAndFriendIds,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        profilePictureUrl: true,
                    },
                },
            },
            orderBy: {
                scheduledAt: 'desc',
            },
        });

        // Dynamically determine isRevealed based on the current time
        const updatedCapsules = capsules.map(capsule => ({
            ...capsule,
            isRevealed: capsule.isRevealed || new Date() >= capsule.scheduledAt,
        }));

        return NextResponse.json({ capsules: updatedCapsules }, { status: 200 });
    } catch (error) {
        console.error('Error fetching capsules:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
