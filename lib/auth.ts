import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export type AuthResult = {
    success: true;
    user: {
        id: string;
        email: string;
        role: string;
        name: string | null;
    };
} | {
    success: false;
    error: string;
    status: number;
};

/**
 * Validates the session token and checks if the user has the required role.
 * Use this in API routes to protect endpoints.
 * 
 * @param requiredRole - Optional role requirement (e.g., 'ADMIN'). If not provided, any authenticated user passes.
 * @returns AuthResult with user data on success, or error details on failure.
 */
export async function validateSession(requiredRole?: string): Promise<AuthResult> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('session_token')?.value;

        if (!token) {
            return { success: false, error: 'No autorizado', status: 401 };
        }

        const session = await prisma.session.findUnique({
            where: { token },
            include: { user: true }
        });

        if (!session || !session.user) {
            return { success: false, error: 'Sesión inválida', status: 401 };
        }

        // Check expiration
        if (session.expiresAt < new Date()) {
            return { success: false, error: 'Sesión expirada', status: 401 };
        }

        const user = session.user;

        // Check role if required
        if (requiredRole && user.role !== requiredRole) {
            return { success: false, error: 'Acceso denegado', status: 403 };
        }

        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name
            }
        };
    } catch (error) {
        console.error('Auth validation error:', error);
        return { success: false, error: 'Error de autenticación', status: 500 };
    }
}
