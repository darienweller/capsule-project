import { getSession } from '@auth0/nextjs-auth0/edge';
import prisma from '../../../lib/prisma';

export async function POST(request) {
    const session = await getSession();

    if (!session || !session.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const auth0Id = session.user.sub;
    const { bio, profile_picture_url } = await request.json();

    try {
        await prisma.user.update({
            where: { auth0Id },
            data: {
                bio,
                profilePictureUrl: profile_picture_url,
            },
        });

        return new Response(JSON.stringify({ message: 'Profile updated successfully.' }), { status: 200 });
    } catch (error) {
        console.error('Error updating profile:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
