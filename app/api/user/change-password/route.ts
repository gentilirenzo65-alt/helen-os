import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        // 1. Validar sesión
        const session = await validateSession();
        if (!session.success || !session.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }


        // 2. Obtener datos
        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' }, { status: 400 });
        }

        // 3. Obtener usuario actual
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        // 4. Verificar contraseña actual
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 400 });
        }

        // 5. Hashear nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 6. Actualizar usuario
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        return NextResponse.json({ success: true, message: 'Contraseña actualizada correctamente' });

    } catch (error) {
        console.error('Error changing password:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
