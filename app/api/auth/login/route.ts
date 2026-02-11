import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const runtime = 'nodejs';

interface Tendero {
    id: string;
    email: string;
    name: string;
    picture?: string;
    nombreTienda?: string;
    zona?: string;
    fotoTienda?: string;
    createdAt: string;
    updatedAt: string;
}

const tenderosPath = path.join(process.cwd(), 'data', 'tenderos.json');

function readTenderos(): Tendero[] {
    try {
        if (!fs.existsSync(tenderosPath)) {
            const dir = path.dirname(tenderosPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(tenderosPath, '[]', 'utf-8');
            return [];
        }
        const content = fs.readFileSync(tenderosPath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error('Error reading tenderos:', error);
        return [];
    }
}

function writeTenderos(tenderos: Tendero[]) {
    try {
        fs.writeFileSync(tenderosPath, JSON.stringify(tenderos, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error writing tenderos:', error);
        throw new Error('Error al guardar tenderos');
    }
}

// POST: Login/Register tendero
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, name, picture } = body;

        if (!email || !name) {
            return NextResponse.json(
                { error: 'Email y nombre requeridos' },
                { status: 400 }
            );
        }

        const tenderos = readTenderos();
        let tendero = tenderos.find((t) => t.email === email);

        const now = new Date().toISOString();

        if (!tendero) {
            // Crear nuevo tendero
            tendero = {
                id: crypto.randomUUID(),
                email,
                name,
                picture: picture || undefined,
                createdAt: now,
                updatedAt: now,
            };
            tenderos.push(tendero);
        } else {
            // Actualizar último acceso
            tendero.updatedAt = now;
            if (picture && !tendero.picture) {
                tendero.picture = picture;
            }
        }

        writeTenderos(tenderos);

        return NextResponse.json({
            ok: true,
            tendero,
            isNew: tenderos.filter((t) => t.email === email).length === 1 && !tendero.nombreTienda,
        });
    } catch (error) {
        console.error('Error en POST /api/auth/login:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
