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

// GET /api/entregas?bodegaId=BOD_002&estado=pendiente&pedidoId=...
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const bodegaId = searchParams.get('bodegaId');
        const estado = searchParams.get('estado');
        const pedidoId = searchParams.get('pedidoId');

        let entregas = await readEntregas();

        // Filtrar por bodegaId
        if (bodegaId) {
            entregas = entregas.filter(e => e.bodegaId === bodegaId);
        }

        // Filtrar por estado
        if (estado) {
            entregas = entregas.filter(e => e.estado === estado);
        }

        // Filtrar por pedidoId
        if (pedidoId) {
            entregas = entregas.filter(e => e.pedidoId === pedidoId);
        }

        return NextResponse.json({
            ok: true,
            entregas,
            total: entregas.length
        });
    } catch (error) {
        console.error('Error in GET /api/entregas:', error);
        return NextResponse.json(
            { ok: false, error: 'Error al obtener entregas' },
            { status: 500 }
        );
    }
}

// POST /api/entregas - Crear nueva entrega desde pedido
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { bodegaId, pedidoId, tenderoNombre, direccion, zona } = body;

        if (!bodegaId || !pedidoId) {
            return NextResponse.json(
                { ok: false, error: 'bodegaId y pedidoId son requeridos' },
                { status: 400 }
            );
        }

        const entregas = await readEntregas();

        // Verificar si ya existe una entrega para este pedido
        const existingEntrega = entregas.find(e => e.pedidoId === pedidoId);
        if (existingEntrega) {
            return NextResponse.json(
                { ok: false, error: 'Ya existe una entrega para este pedido' },
                { status: 400 }
            );
        }

        // Crear nueva entrega
        const newEntrega: Entrega = {
            id: `ENT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            bodegaId,
            pedidoId,
            tenderoNombre: tenderoNombre || 'Sin nombre',
            direccion: direccion || 'Sin dirección',
            zona: zona || 'Sin zona',
            repartidorId: undefined,
            repartidorNombre: undefined,
            estado: 'pendiente',
            etaMin: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        entregas.push(newEntrega);
        await writeEntregas(entregas);

        return NextResponse.json({
            ok: true,
            entrega: newEntrega
        }, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/entregas:', error);
        return NextResponse.json(
            { ok: false, error: 'Error al crear entrega' },
            { status: 500 }
        );
    }
}
