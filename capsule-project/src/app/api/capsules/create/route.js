import {NextResponse} from 'next/server';
import {getSession} from '@auth0/nextjs-auth0/edge';
import prisma from '../../../../lib/prisma';

export async function POST(request) {
    // Get the user session
    const session = await getSession();

    if (!session || !session.user) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const auth0Id = session.user.sub;

    // Parse the request body
    const {content, timerDuration} = await request.json();

    if (!content || content.trim() === '') {
        return NextResponse.json({error: 'Content is required'}, {status: 400});
    }

    // Validate timerDuration
    if (!timerDuration || timerDuration < 20 || timerDuration > 300) {
        return NextResponse.json({error: 'Timer duration must be between 20 and 300 seconds'}, {status: 400});
    }

    try {
        // Find the user in the database
        const user = await prisma.user.findUnique({
            where: {auth0Id},
        });

        if (!user) {
            return NextResponse.json({error: 'User not found'}, {status: 404});
        }

        // Calculate the scheduledAt time
        const scheduledAt = new Date(Date.now() + timerDuration * 1000);

        // Create the new capsule
        const newCapsule = await prisma.capsule.create({
            data: {
                content,
                scheduledAt,
                isRevealed: false, // Default to not revealed
                userId: user.id, // Link capsule to user
            },
        });

        return NextResponse.json({message: 'Capsule created successfully', capsule: newCapsule}, {status: 201});
    } catch (error) {
        console.error('Error creating capsule:', error);
        return NextResponse.json({error: 'Internal Server Error'}, {status: 500});
    }
}
