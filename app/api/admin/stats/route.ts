import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    // Auth check - Admin only
    const auth = await validateSession('ADMIN');
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        // 1. Total Users Now
        const totalUsers = await prisma.user.count();

        // 2. Users 24 hours ago (Calculated from createdAt for demo, ideally snapshots)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const usersYesterday = await prisma.user.count({ where: { createdAt: { lt: oneDayAgo } } });

        // Change %
        let userChange = 0;
        if (usersYesterday > 0) userChange = ((totalUsers - usersYesterday) / usersYesterday) * 100;
        else if (totalUsers > 0) userChange = 100;

        const formattedChange = (userChange > 0 ? '+' : '') + userChange.toFixed(1) + '%';

        // 3. Real Revenue (from PaymentLog)
        // Group by date (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const payments = await prisma.paymentLog.findMany({
            where: { createdAt: { gte: thirtyDaysAgo }, status: 'SUCCEEDED' },
            orderBy: { createdAt: 'asc' }
        });

        // Aggregate by day for chart
        const revenueMap = new Map<string, number>();
        payments.forEach(p => {
            const dateStr = p.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
            revenueMap.set(dateStr, (revenueMap.get(dateStr) || 0) + p.amount);
        });

        const revenueData = Array.from(revenueMap.entries()).map(([date, amount]) => ({
            date,
            amount
        }));

        // Total Revenue (Lifetime or Period?) - Let's do Total Lifetime for the card
        const totalRevenueAgg = await prisma.paymentLog.aggregate({
            _sum: { amount: true },
            where: { status: 'SUCCEEDED' }
        });
        const totalRevenue = totalRevenueAgg._sum.amount || 0;

        // 4. Renewal Metrics (Cohorts)
        // Month 1: Users older than 30 days. How many have renewalCount >= 1?
        // Month 2: Users older than 60 days. How many have renewalCount >= 2?
        // Month 3: Users older than 90 days. How many have renewalCount >= 3?

        const now = new Date();
        const date30DaysAgo = new Date(now.setDate(now.getDate() - 30));
        const date60DaysAgo = new Date(now.setDate(now.getDate() - 30)); // -60 total
        const date90DaysAgo = new Date(now.setDate(now.getDate() - 30)); // -90 total

        // Helper to get retention %
        const getRetention = async (daysAgo: Date, minRenewal: number) => {
            const totalCohort = await prisma.user.count({ where: { createdAt: { lte: daysAgo } } });
            if (totalCohort === 0) return 0;
            const retained = await prisma.user.count({
                where: {
                    createdAt: { lte: daysAgo },
                    renewalCount: { gte: minRenewal }
                }
            });
            return (retained / totalCohort) * 100;
        };

        const retentionM1 = await getRetention(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 1);
        const retentionM2 = await getRetention(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), 2);
        const retentionM3 = await getRetention(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), 3);

        // 5. Get Top Content (sorted by Likes + Notes)
        const rawContent = await prisma.content.findMany({
            include: {
                interactions: true // Include all interactions to count
            },
            take: 50
        });

        const topContent = rawContent
            .map(c => {
                let mediaObj = [];
                try { mediaObj = JSON.parse(c.media); } catch { mediaObj = [{ url: '' }]; }

                return {
                    id: c.id,
                    title: c.title,
                    releaseDay: c.dayOffset,
                    media: mediaObj,
                    likes: c.interactions.filter(i => i.liked).length,
                    notesCount: c.interactions.filter(i => i.note && i.note.trim().length > 0).length,
                    commentsCount: 0,
                    topComment: "Sin notas",
                    createdAt: c.createdAt
                };
            })

            .sort((a, b) => (b.likes + b.notesCount) - (a.likes + a.notesCount)); // Sort by total interaction initially

        // Future: Count revenue, retention, etc from real tables
        const stats = {
            activeUsers: totalUsers,
            userChange: formattedChange,
            userChangePositive: userChange >= 0,
            topContent: topContent,
            revenue: totalRevenue,
            revenueData: revenueData, // New field for chart
            renewal: {
                m1: retentionM1.toFixed(0),
                m2: retentionM2.toFixed(0),
                m3: retentionM3.toFixed(0)
            }
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
