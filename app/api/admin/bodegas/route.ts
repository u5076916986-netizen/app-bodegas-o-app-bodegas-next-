import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const BODEGAS_CSV = path.join(process.cwd(), 'data', 'bodegas.csv');
const BODEGAS_ADMIN_JSON = path.join(process.cwd(), 'data', 'bodegas_admin.json');

interface Bodega {
    bodega_id: string;
    nombre: string;
    categoria_principal: string;
    correo_pedidos: string;
    telefono: string;
    ciudad: string;
    zona: string;
    direccion: string;
    horario_texto: string;
    metodos_pago: string;
    min_pedido_cop: number;
    tiempo_entrega_estimado: string;
    estado: string;
    logo_url: string;
}

// Read bodegas from CSV
function readBodegasFromCSV(): Bodega[] {
    try {
        if (!fs.existsSync(BODEGAS_CSV)) {
            return [];
        }

        const content = fs.readFileSync(BODEGAS_CSV, 'utf-8');
        const parsed = Papa.parse(content, {
            header: true,
            skipEmptyLines: true,
        });

        return parsed.data.map((row: any) => ({
            bodega_id: row.bodega_id || '',
            nombre: row.nombre || '',
            categoria_principal: row.categoria_principal || '',
            correo_pedidos: row.correo_pedidos || '',
            telefono: row.telefono || '',
            ciudad: row.ciudad || '',
            zona: row.zona || '',
            direccion: row.direccion || '',
            horario_texto: row.horario_texto || '',
            metodos_pago: row.metodos_pago || '',
            min_pedido_cop: parseInt(row.min_pedido_cop) || 0,
            tiempo_entrega_estimado: row.tiempo_entrega_estimado || '',
            estado: row.estado || 'activo',
            logo_url: row.logo_url || '',
        }));
    } catch (error) {
        console.error('Error reading bodegas CSV:', error);
        return [];
    }
}

// Read admin overrides from JSON
function readAdminOverrides() {
    try {
        if (!fs.existsSync(BODEGAS_ADMIN_JSON)) {
            return {};
        }
        const content = fs.readFileSync(BODEGAS_ADMIN_JSON, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error('Error reading admin overrides:', error);
        return {};
    }
}

// Write admin overrides to JSON
function writeAdminOverrides(overrides: any) {
    try {
        const dir = path.dirname(BODEGAS_ADMIN_JSON);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(BODEGAS_ADMIN_JSON, JSON.stringify(overrides, null, 2));
    } catch (error) {
        console.error('Error writing admin overrides:', error);
        throw error;
    }
}

// Merge CSV data with admin overrides
function getMergedBodegas(): Bodega[] {
    const csvBodegas = readBodegasFromCSV();
    const overrides = readAdminOverrides();

    return csvBodegas.map(bodega => {
        const override = overrides[bodega.bodega_id];
        if (override) {
            return { ...bodega, ...override };
        }
        return bodega;
    });
}

// GET: Retrieve all bodegas
export async function GET(request: NextRequest) {
    try {
        const bodegas = getMergedBodegas();
        return NextResponse.json({ ok: true, bodegas });
    } catch (error) {
        console.error('GET /api/admin/bodegas error:', error);
        return NextResponse.json(
            { ok: false, error: 'Error al cargar bodegas' },
            { status: 500 }
        );
    }
}

// POST: Update bodega (saves to admin overrides JSON)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { bodega_id, estado, min_pedido_cop, horario_texto, metodos_pago } = body;

        if (!bodega_id) {
            return NextResponse.json(
                { ok: false, error: 'bodega_id requerido' },
                { status: 400 }
            );
        }

        const overrides = readAdminOverrides();

        // Create or update override for this bodega
        if (!overrides[bodega_id]) {
            overrides[bodega_id] = {};
        }

        if (estado !== undefined) {
            overrides[bodega_id].estado = estado;
        }
        if (min_pedido_cop !== undefined) {
            overrides[bodega_id].min_pedido_cop = min_pedido_cop;
        }
        if (horario_texto !== undefined) {
            overrides[bodega_id].horario_texto = horario_texto;
        }
        if (metodos_pago !== undefined) {
            overrides[bodega_id].metodos_pago = metodos_pago;
        }

        overrides[bodega_id].updatedAt = new Date().toISOString();

        writeAdminOverrides(overrides);

        // Return merged bodega data
        const bodegas = getMergedBodegas();
        const updatedBodega = bodegas.find(b => b.bodega_id === bodega_id);

        return NextResponse.json({ ok: true, bodega: updatedBodega });
    } catch (error) {
        console.error('POST /api/admin/bodegas error:', error);
        return NextResponse.json(
            { ok: false, error: 'Error al actualizar bodega' },
            { status: 500 }
        );
    }
}
