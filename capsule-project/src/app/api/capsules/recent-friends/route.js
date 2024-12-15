import { getSession } from '@auth0/nextjs-auth0/edge';
import prisma from '@/lib/prisma';

export async function GET(request) {
    try {
        // Validate the user session
        const session = await getSession();

        if (!session || !session.user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const auth0Id = session.user.sub;

        // Find the user in the database
        const user = await prisma.user.findUnique({
            where: { auth0Id },
        });

        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
        }

        // Fetch the user's friends
        const friends = await prisma.friend.findMany({
            where: { userId: user.id },
            include: { friend: true },
        });

        if (!friends || friends.length === 0) {
            return new Response(JSON.stringify({ recentPosts: [] }), { status: 200 });
        }

        // Fetch the most recent post from each friend
        const recentPosts = await Promise.all(
            friends.map(async (friend) => {
                const post = await prisma.capsule.findFirst({
                    where: { userId: friend.friendId },
                    include: {
                        user: {
                            select: { email: true, profilePictureUrl: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                });
                return post;
            })
        );

        // Filter out friends without posts and sort the result
        const filteredAndSortedPosts = recentPosts
            .filter((post) => post !== null)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3); // Limit to 3 posts

        return new Response(JSON.stringify({ recentPosts: filteredAndSortedPosts }), { status: 200 });
    } catch (error) {
        console.error('Error fetching recent posts:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
