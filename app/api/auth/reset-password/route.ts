import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json({ error: 'Token y contraseña son requeridos' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
        }

        // Find valid reset token
        const resetToken = await prisma.passwordReset.findUnique({
            where: { token },
            include: { user: true }
        });

        if (!resetToken) {
            return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 });
        }

        if (resetToken.used) {
            return NextResponse.json({ error: 'Este enlace ya fue utilizado' }, { status: 400 });
        }

        if (resetToken.expiresAt < new Date()) {
            return NextResponse.json({ error: 'Este enlace ha expirado' }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user password
        await prisma.user.update({
            where: { id: resetToken.userId },
            data: { password: hashedPassword }
        });

        // Mark token as used
        await prisma.passwordReset.update({
            where: { id: resetToken.id },
            data: { used: true }
        });

        // Optionally: Invalidate all sessions for this user (force re-login)
        await prisma.session.deleteMany({
            where: { userId: resetToken.userId }
        });

        console.log(`Password reset successfully for user ${resetToken.user.email}`);

        return NextResponse.json({
            success: true,
            message: 'Contraseña actualizada correctamente. Ahora puedes iniciar sesión.'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
