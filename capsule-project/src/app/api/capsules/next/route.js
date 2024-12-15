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

        // Fetch the next scheduled capsule for the user
        const nextCapsule = await prisma.capsule.findFirst({
            where: {
                userId: user.id,
                scheduledAt: {
                    gte: new Date(), // Ensure the capsule is in the future
                },
            },
            orderBy: { scheduledAt: 'asc' },
        });

        if (!nextCapsule) {
            return new Response(JSON.stringify({ nextCapsule: null }), { status: 200 });
        }

        return new Response(JSON.stringify({ nextCapsule }), { status: 200 });
    } catch (error) {
        console.error('Error fetching next capsule:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
