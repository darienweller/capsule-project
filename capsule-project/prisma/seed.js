const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.capsule.createMany({
        data: [
            {
                content: "Reveal after 20 seconds.",
                scheduledAt: new Date(Date.now() + 20000), // 20 seconds
                isRevealed: false,
                userId: 1,
            },
            {
                content: "Reveal after 300 seconds.",
                scheduledAt: new Date(Date.now() + 300000), // 300 seconds
                isRevealed: false,
                userId: 1,
            },
        ],
    });
    console.log('Capsules seeded!');
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
