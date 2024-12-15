import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const notifications = await prisma.notification.findMany({
            where: { userId: parseInt(userId, 10) },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(notifications);
    } catch (error) {
        console.error('GET /api/notifications error:', error);
        return NextResponse.json({ error: 'Error fetching notifications' }, { status: 500 });
    }
}
