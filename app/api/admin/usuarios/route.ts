import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const TENDEROS_FILE = path.join(process.cwd(), 'data', 'tenderos.json');

function readTenderos() {
    try {
        if (!fs.existsSync(TENDEROS_FILE)) {
            return [];
        }
        const content = fs.readFileSync(TENDEROS_FILE, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error('Error reading tenderos:', error);
        return [];
    }
}

function writeTenderos(tenderos: any[]) {
    try {
        const dir = path.dirname(TENDEROS_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(TENDEROS_FILE, JSON.stringify(tenderos, null, 2));
    } catch (error) {
        console.error('Error writing tenderos:', error);
        throw error;
    }
}

// GET: Retrieve all usuarios
export async function GET(request: NextRequest) {
    try {
        const tenderos = readTenderos();

        // Ensure all tenderos have estado field (default to 'activo')
        const tenderosWithEstado = tenderos.map((t: any) => ({
            ...t,
            estado: t.estado || 'activo',
        }));

        return NextResponse.json({ ok: true, usuarios: tenderosWithEstado });
    } catch (error) {
        console.error('GET /api/admin/usuarios error:', error);
        return NextResponse.json(
            { ok: false, error: 'Error al cargar usuarios' },
            { status: 500 }
        );
    }
}

// POST: Update usuario estado or other fields
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, estado } = body;

        if (!email) {
            return NextResponse.json(
                { ok: false, error: 'Email requerido' },
                { status: 400 }
            );
        }

        const tenderos = readTenderos();
        const index = tenderos.findIndex((t: any) => t.email === email);

        if (index === -1) {
            return NextResponse.json(
                { ok: false, error: 'Usuario no encontrado' },
                { status: 404 }
            );
        }

        // Update estado
        if (estado) {
            tenderos[index].estado = estado;
            tenderos[index].updatedAt = new Date().toISOString();
        }

        writeTenderos(tenderos);

        return NextResponse.json({ ok: true, usuario: tenderos[index] });
    } catch (error) {
        console.error('POST /api/admin/usuarios error:', error);
        return NextResponse.json(
            { ok: false, error: 'Error al actualizar usuario' },
            { status: 500 }
        );
    }
}
