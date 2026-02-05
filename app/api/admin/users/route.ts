import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/auth';

export async function GET() {
    // Auth check - Admin only
    const auth = await validateSession('ADMIN');
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const users = await prisma.user.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                id: true,
                name: true,
                email: true,
                status: true,
                role: true,
                createdAt: true,
                subscriptionStart: true,
                // New Fields
                interests: true,
                engagementScore: true,
                lastActiveAt: true
            }
        });

        // Transform data for UI if needed
        const formattedUsers = users.map((user) => {
            const startDate = user.subscriptionStart ? new Date(user.subscriptionStart) : null;
            const daysSubscribed = startDate
                ? Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 3600 * 24))
                : 0;

            return {
                ...user,
                daysSubscribed,
                // Ensure avatar is handled
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`
            };
        });

        return NextResponse.json(formattedUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}
