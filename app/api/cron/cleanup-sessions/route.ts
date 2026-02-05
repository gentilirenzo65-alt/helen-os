import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// This endpoint cleans up expired sessions
// Can be called by a cron job every 48 hours
// For security, use a secret token in production

export async function POST(request: Request) {
    try {
        // Optional: Verify secret token for production security
        const authHeader = request.headers.get('Authorization');
        const expectedToken = process.env.CRON_SECRET;

        if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Delete all expired sessions
        const result = await prisma.session.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            }
        });

        console.log(`Session cleanup: Deleted ${result.count} expired sessions`);

        return NextResponse.json({
            success: true,
            deletedCount: result.count,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Session cleanup error:', error);
        return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
    }
}

// GET method for health check
export async function GET() {
    try {
        const expiredCount = await prisma.session.count({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            }
        });

        const totalCount = await prisma.session.count();

        return NextResponse.json({
            status: 'ok',
            totalSessions: totalCount,
            expiredSessions: expiredCount,
            message: `${expiredCount} sessions ready for cleanup`
        });
    } catch (error) {
        return NextResponse.json({ error: 'Health check failed' }, { status: 500 });
    }
}
