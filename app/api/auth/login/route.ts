import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email y password requeridos' },
                { status: 400 }
            );
        }

        const tendero = await prisma.tendero.findUnique({ where: { email } });

        if (!tendero || !tendero.password) {
            // Se usa un mensaje genérico para no revelar si el usuario existe
            return NextResponse.json(
                { error: 'Credenciales inválidas' },
                { status: 401 }
            );
        }

        const isPasswordValid = await bcrypt.compare(password, tendero.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Credenciales inválidas' },
                { status: 401 }
            );
        }

        // Excluimos el password del objeto que se retorna
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userWithoutPassword } = tendero;

        return NextResponse.json({
            ok: true,
            tendero: userWithoutPassword,
        });

    } catch (error) {
        console.error('Error en POST /api/auth/login:', error);
        if (error instanceof Error) {
            console.error(`Detalle: ${error.message}`);
        }
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}