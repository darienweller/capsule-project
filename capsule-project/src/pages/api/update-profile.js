import { getSession } from '@auth0/nextjs-auth0';
import prisma from '../../lib/prisma';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    const session = await getSession(req, res);
    if (!session || !session.user) {
        console.error('No session or session.user');
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const auth0Id = session.user.sub;
    const { bio, profile_picture_url } = req.body;

    // Correct the field name to match Prisma schema
    const profilePictureUrl = profile_picture_url;

    try {
        await prisma.user.update({
            where: { auth0Id },
            data: {
                bio,
                profilePictureUrl,
            },
        });

        res.status(200).json({ message: 'Profile updated successfully.' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
