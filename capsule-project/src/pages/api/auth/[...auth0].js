import { handleAuth, handleCallback } from '@auth0/nextjs-auth0';
import prisma from '../../../lib/prisma';
import '../../../cron/capsuleRevealCron';

const afterCallback = async (req, res, session, state) => {
    const { user } = session;
    const auth0Id = user.sub;
    const email = user.email;

    // Check if the user exists in your database
    let dbUser = await prisma.user.findUnique({
        where: { auth0Id },
    });

    if (!dbUser) {
        // Create the user in your database
        dbUser = await prisma.user.create({
            data: {
                auth0Id,
                email,
            },
        });
    }

    // Attach the user ID from your database to the session
    session.userId = dbUser.id;

    return session;
};

export default handleAuth({
    async callback(req, res) {
        try {
            await handleCallback(req, res, { afterCallback });
        } catch (error) {
            res.status(error.status || 500).end(error.message);
        }
    },
});

