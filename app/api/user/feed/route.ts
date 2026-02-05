import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('session_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const session = await prisma.session.findUnique({
            where: { token },
            include: { user: true }
        });

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Session invalid' }, { status: 401 });
        }

        const user = session.user;
        const subscriptionStart = user.subscriptionStart ? new Date(user.subscriptionStart) : new Date();

        // Get all content with user's interactions
        const allContent = await prisma.content.findMany({
            orderBy: { dayOffset: 'asc' },
            include: {
                interactions: {
                    where: { userId: user.id }
                }
            }
        });

        // Get user's favorites (content IDs where favorite=true)
        const userInteractions = await prisma.userContentInteraction.findMany({
            where: { userId: user.id }
        });

        const favorites = userInteractions
            .filter(i => i.favorite)
            .map(i => i.contentId);

        // Map to User 'Delivery' type with personalized logic
        const deliveries = allContent.map((c: any) => {
            let media = [];
            try {
                media = JSON.parse(c.media);
            } catch (e) {
                media = [{ type: 'image', url: 'https://via.placeholder.com/400' }]; // Fallback
            }

            // Calculate Unlock Time based on User Subscription
            // Unlock Date = SubscriptionStart + (DayOffset - 1) days + UnlockHour
            const unlockHourMs = (c.unlockHour || 0) * 60 * 60 * 1000;
            const dayOffsetMs = (c.dayOffset - 1) * 24 * 60 * 60 * 1000;

            const unlockDate = new Date(subscriptionStart.getTime() + dayOffsetMs + unlockHourMs);
            const now = new Date();

            // Minutes until unlock (if negative, it's already unlocked)
            const diffMs = unlockDate.getTime() - now.getTime();
            const minutesUntilUnlock = Math.ceil(diffMs / (1000 * 60));

            // Get user's interaction for this content
            const interaction = c.interactions[0];

            return {
                id: c.id,
                order: c.dayOffset,
                title: c.title || `Día ${c.dayOffset}`,
                helenNote: interaction?.note || 'Contenido exclusivo para ti',
                media: media,
                unlockAfterMinutes: Math.max(0, minutesUntilUnlock),
                preUnlockView: 'blurred',
                showTimer: true,
                isLocked: minutesUntilUnlock > 0,
                liked: interaction?.liked || false,
                isFavorite: interaction?.favorite || false
            };
        });

        return NextResponse.json({
            subscriptionStart: subscriptionStart.toISOString(),
            subscriptionEnd: user.subscriptionEnd ? new Date(user.subscriptionEnd).toISOString() : null,
            deliveries: deliveries,
            favorites: favorites,
            user: {
                name: user.name || 'Usuario',
                email: user.email
            }
        });
    } catch (error) {
        console.error('Error fetching user feed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
