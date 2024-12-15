import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import prisma from '../../lib/prisma';

export default withApiAuthRequired(async function handler(req, res) {
    const session = getSession(req, res);
    console.log('Session:', session); // Debug session

    if (!session || !session.user) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    const { user } = session;
    try {
        // Find the user in the db using auth0Id
        let dbUser = await prisma.user.findUnique({
            where: {
                auth0Id: user.sub, // Use auth0Id field from schema
            },
        });

        // If the user doesn't exist, create a new entry in the database
        if (!dbUser) {
            dbUser = await prisma.user.create({
                data: {
                    auth0Id: user.sub,             // match schema field
                    email: user.email,
                    profilePictureUrl: user.picture // match schema field
                    // Remove name field since not in schema
                },
            });
        } else {
            // If the user exists, update their information (optional)
            dbUser = await prisma.user.update({
                where: {
                    auth0Id: user.sub,
                },
                data: {
                    email: user.email,
                    profilePictureUrl: user.picture
                    // Remove name field since not in schema
                },
            });
        }

        // Return the user information from the database
        res.status(200).json(dbUser);
    } catch (error) {
        console.error('Error creating/updating user:', error);
        res.status(500).json({ error: 'User authentication failed', details: error.message });
    }
});
