import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET the user's friends
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const friends = await prisma.friend.findMany({
            where: { userId: parseInt(userId, 10), status: 'accepted' },
            include: {
                friend: true,
            },
        });

        return NextResponse.json(friends);
    } catch (error) {
        console.error('GET /api/friends error:', error);
        return NextResponse.json({ error: 'Error fetching friends' }, { status: 500 });
    }
}

// POST: Send a friend request and create notification for the recipient.
export async function POST(request) {
    try {
        const body = await request.json();
        const { userId, friendId } = body;

        if (!userId || !friendId) {
            return NextResponse.json({ error: 'Missing userId or friendId' }, { status: 400 });
        }

        // Check if a request or friendship already exists
        const existingRequest = await prisma.friend.findFirst({
            where: {
                userId: parseInt(userId, 10),
                friendId: parseInt(friendId, 10),
            },
        });

        if (existingRequest) {
            return NextResponse.json({ error: 'Friendship or request already exists' }, { status: 400 });
        }

        // Create friend request with 'requested' status
        const newRequest = await prisma.friend.create({
            data: {
                userId: parseInt(userId, 10),
                friendId: parseInt(friendId, 10),
                status: 'requested',
            },
        });

        // Create a notification for the recipient (friendId)
        await prisma.notification.create({
            data: {
                userId: parseInt(friendId, 10),
                senderId: parseInt(userId, 10),
                type: 'friend_request',
                message: `User with ID ${userId} has sent you a friend request.`,
            },
        });

        return NextResponse.json(newRequest, { status: 201 });
    } catch (error) {
        console.error('POST /api/friends error:', error);
        return NextResponse.json({ error: 'Error sending friend request' }, { status: 500 });
    }
}

// PATCH: Accept or Deny a friend request
export async function PATCH(request) {
    try {
        const body = await request.json();
        const { userId, friendId, action } = body;

        if (!userId || !friendId || !action) {
            return NextResponse.json({ error: 'Missing userId, friendId, or action' }, { status: 400 });
        }

        // Find the friend request
        const friendRequest = await prisma.friend.findFirst({
            where: {
                userId: parseInt(friendId, 10),  // original sender
                friendId: parseInt(userId, 10),  // original recipient
                status: 'requested',
            },
        });

        if (!friendRequest) {
            return NextResponse.json({ error: 'No pending friend request found' }, { status: 404 });
        }

        if (action === 'accept') {
            // Update the existing friend request status to accepted
            await prisma.friend.update({
                where: { id: friendRequest.id },
                data: { status: 'accepted' },
            });

            // Ensure a reciprocal entry exists
            const reciprocal = await prisma.friend.findFirst({
                where: {
                    userId: parseInt(userId, 10),
                    friendId: parseInt(friendId, 10),
                },
            });

            if (!reciprocal) {
                await prisma.friend.create({
                    data: {
                        userId: parseInt(userId, 10),
                        friendId: parseInt(friendId, 10),
                        status: 'accepted',
                    },
                });
            } else {
                // If a reciprocal already exists and is not accepted, update it.
                if (reciprocal.status !== 'accepted') {
                    await prisma.friend.update({
                        where: { id: reciprocal.id },
                        data: { status: 'accepted' },
                    });
                }
            }

            // Mark the original friend request notification as read
            const notification = await prisma.notification.findFirst({
                where: {
                    userId: parseInt(userId, 10),    // original recipient (now accepting)
                    senderId: parseInt(friendId, 10), // original sender
                    type: 'friend_request',
                    isRead: false
                },
            });

            if (notification) {
                await prisma.notification.update({
                    where: { id: notification.id },
                    data: { isRead: true },
                });
            }

            await prisma.notification.create({
                data: {
                    userId: parseInt(friendId, 10),  // original sender
                    senderId: parseInt(userId, 10),  // acceptor
                    type: 'friend_request_accepted',
                    message: `Your friend request to user with ID ${userId} was accepted.`,
                },
            });

            return NextResponse.json({ message: 'Friend request accepted' });

        } else if (action === 'deny') {
            // Update the friend request status to denied
            await prisma.friend.update({
                where: { id: friendRequest.id },
                data: { status: 'denied' },
            });

            // Mark the original friend request notification as read
            const notification = await prisma.notification.findFirst({
                where: {
                    userId: parseInt(userId, 10),    // original recipient (now denying)
                    senderId: parseInt(friendId, 10), // original sender
                    type: 'friend_request',
                    isRead: false
                },
            });

            if (notification) {
                await prisma.notification.update({
                    where: { id: notification.id },
                    data: { isRead: true },
                });
            }

            return NextResponse.json({ message: 'Friend request denied' });
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('PATCH /api/friends error:', error);
        return NextResponse.json({ error: 'Error updating friend request' }, { status: 500 });
    }
}

// DELETE: Remove a friend
export async function DELETE(request) {
    try {
        const body = await request.json();
        const { userId, friendId } = body;

        if (!userId || !friendId) {
            return NextResponse.json({ error: 'Missing userId or friendId' }, { status: 400 });
        }

        await prisma.friend.deleteMany({
            where: {
                userId: parseInt(userId, 10),
                friendId: parseInt(friendId, 10),
            },
        });

        await prisma.friend.deleteMany({
            where: {
                userId: parseInt(friendId, 10),
                friendId: parseInt(userId, 10),
            },
        });

        return NextResponse.json({ message: 'Friend relationship removed successfully' });
    } catch (error) {
        console.error('DELETE /api/friends error:', error);
        return NextResponse.json({ error: 'Error removing friend' }, { status: 500 });
    }
}
