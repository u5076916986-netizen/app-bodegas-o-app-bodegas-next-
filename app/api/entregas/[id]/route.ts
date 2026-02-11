import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const runtime = 'nodejs';

interface Entrega {
    id: string;
    bodegaId: string;
    pedidoId: string;
    tenderoNombre?: string;
    direccion?: string;
    zona?: string;
    repartidorId?: string;
    repartidorNombre?: string;
    estado: 'pendiente' | 'en_ruta' | 'entregada' | 'retrasada';
    etaMin?: number;
    createdAt: string;
    updatedAt: string;
}

const entregasFilePath = join(process.cwd(), 'data', 'entregas.json');

async function ensureDataDir() {
    const dataDir = join(process.cwd(), 'data');
    if (!existsSync(dataDir)) {
        await mkdir(dataDir, { recursive: true });
    }
}

async function readEntregas(): Promise<Entrega[]> {
    try {
        await ensureDataDir();
        if (!existsSync(entregasFilePath)) {
            await writeFile(entregasFilePath, JSON.stringify([], null, 2), 'utf-8');
            return [];
        }
        const content = await readFile(entregasFilePath, 'utf-8');
        return JSON.parse(content) as Entrega[];
    } catch (error) {
        console.error('Error reading entregas:', error);
        return [];
    }
}

async function writeEntregas(entregas: Entrega[]): Promise<void> {
    await ensureDataDir();
    await writeFile(entregasFilePath, JSON.stringify(entregas, null, 2), 'utf-8');
}

// PATCH /api/entregas/[id] - Actualizar estado, repartidor, etaMin
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { estado, repartidorId, repartidorNombre, etaMin } = body;

        const entregas = await readEntregas();
        const entregaIndex = entregas.findIndex(e => e.id === id);

        if (entregaIndex === -1) {
            return NextResponse.json(
                { ok: false, error: 'Entrega no encontrada' },
                { status: 404 }
            );
        }

        // Actualizar campos proporcionados
        if (estado) {
            entregas[entregaIndex].estado = estado;
        }
        if (repartidorId !== undefined) {
            entregas[entregaIndex].repartidorId = repartidorId;
        }
        if (repartidorNombre !== undefined) {
            entregas[entregaIndex].repartidorNombre = repartidorNombre;
        }
        if (etaMin !== undefined) {
            entregas[entregaIndex].etaMin = etaMin;
        }

        entregas[entregaIndex].updatedAt = new Date().toISOString();

        await writeEntregas(entregas);

        return NextResponse.json({
            ok: true,
            entrega: entregas[entregaIndex]
        });
    } catch (error) {
        console.error('Error in PATCH /api/entregas/[id]:', error);
        return NextResponse.json(
            { ok: false, error: 'Error al actualizar entrega' },
            { status: 500 }
        );
    }
}

// GET /api/entregas/[id] - Obtener una entrega específica
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const entregas = await readEntregas();
        const entrega = entregas.find(e => e.id === id);

        if (!entrega) {
            return NextResponse.json(
                { ok: false, error: 'Entrega no encontrada' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            ok: true,
            entrega
        });
    } catch (error) {
        console.error('Error in GET /api/entregas/[id]:', error);
        return NextResponse.json(
            { ok: false, error: 'Error al obtener entrega' },
            { status: 500 }
        );
    }
}
