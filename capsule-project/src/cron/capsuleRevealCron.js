import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

cron.schedule('*/1 * * * * *', async () => { // Runs every second
    console.log('Running capsule reveal cron job...');
    try {
        const result = await prisma.capsule.updateMany({
            where: {
                isRevealed: false,
                scheduledAt: { lte: new Date() },
            },
            data: {
                isRevealed: true,
            },
        });

        console.log(`${result.count} capsules revealed.`);
    } catch (error) {
        console.error('Error running capsule reveal cron job:', error);
    }
});
