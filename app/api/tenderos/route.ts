import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
        const dir = path.dirname(tenderosPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(tenderosPath, JSON.stringify(tenderos, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error writing tenderos:', error);
        throw new Error('Error al guardar tenderos');
    }
}

// GET: Obtener tendero por email
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json(
                { error: 'Email requerido' },
                { status: 400 }
            );
        }

        const tenderos = readTenderos();
        const tendero = tenderos.find((t) => t.email === email);

        if (!tendero) {
            return NextResponse.json(
                { error: 'Tendero no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({ tendero });
    } catch (error) {
        console.error('Error en GET /api/tenderos:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// PUT: Actualizar tendero
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, nombreTienda, zona, fotoTienda } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'Email requerido' },
                { status: 400 }
            );
        }

        const tenderos = readTenderos();
        const index = tenderos.findIndex((t) => t.email === email);

        if (index === -1) {
            return NextResponse.json(
                { error: 'Tendero no encontrado' },
                { status: 404 }
            );
        }

        const tendero = tenderos[index];
        tendero.updatedAt = new Date().toISOString();

        if (nombreTienda !== undefined) tendero.nombreTienda = nombreTienda;
        if (zona !== undefined) tendero.zona = zona;
        if (fotoTienda !== undefined) tendero.fotoTienda = fotoTienda;

        tenderos[index] = tendero;
        writeTenderos(tenderos);

        return NextResponse.json({
            ok: true,
            tendero,
        });
    } catch (error) {
        console.error('Error en PUT /api/tenderos:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
