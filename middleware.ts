import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Always allow static assets, auth APIs, and login
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/webhooks') ||
        pathname.includes('.') ||
        pathname === '/login'
    ) {
        return NextResponse.next();
    }

    // 2. Check for Supabase credentials
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error('Middleware: Missing Supabase credentials');
        // Allow request to proceed - let the page handle auth
        return NextResponse.next();
    }

    // 3. Get Session Token from Cookie
    const token = request.cookies.get('session_token')?.value;

    // 4. If no token, redirect to login for protected routes
    if (!token) {
        if (pathname.startsWith('/admin') || pathname.startsWith('/user') || pathname === '/') {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.next();
    }

    // 5. Validate Session via Supabase REST API (Edge-compatible)
    try {
        // Create timeout for fetch (3 seconds - reduced for faster fallback)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const sessionRes = await fetch(
            `${SUPABASE_URL}/rest/v1/Session?token=eq.${token}&select=id,expiresAt,user:User(id,role,status,subscriptionEnd)`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            }
        );

        clearTimeout(timeoutId);

        if (!sessionRes.ok) {
            console.error('Middleware: Supabase fetch failed', sessionRes.status);
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const sessions = await sessionRes.json();

        if (!sessions || sessions.length === 0) {
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('session_token');
            return response;
        }

        const session = sessions[0];
        const user = session.user;

        // Check Session Expiration
        const expiresAt = new Date(session.expiresAt);
        if (expiresAt < new Date()) {
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('session_token');
            return response;
        }

        // Check User Status and Subscription (for USER role)
        if (user.role === 'USER') {
            if (user.status !== 'ACTIVE') {
                const response = NextResponse.redirect(new URL('/login?error=inactive', request.url));
                response.cookies.delete('session_token');
                return response;
            }
            if (user.subscriptionEnd && new Date(user.subscriptionEnd) < new Date()) {
                const response = NextResponse.redirect(new URL('/login?error=expired', request.url));
                response.cookies.delete('session_token');
                return response;
            }
        }

        // Role-Based Access Control
        if (pathname.startsWith('/admin') && user.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/user', request.url));
        }

        if (pathname.startsWith('/user') && user.role === 'ADMIN') {
            return NextResponse.redirect(new URL('/admin', request.url));
        }

        // Handle root path based on role
        if (pathname === '/') {
            return NextResponse.redirect(new URL(user.role === 'ADMIN' ? '/admin' : '/user', request.url));
        }

        return NextResponse.next();

    } catch (error: any) {
        // If request was aborted due to timeout, proceed without validation
        if (error.name === 'AbortError') {
            console.error('Middleware: Supabase timeout, proceeding without validation');
            return NextResponse.next();
        }

        console.error('Middleware: Error validating session', error);
        return NextResponse.redirect(new URL('/login', request.url));
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api routes (let them handle their own auth)
         */
        '/((?!_next/static|_next/image|favicon.ico|api/).*)',
    ],
};
