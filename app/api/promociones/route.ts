import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function calcularEstado(fechaInicio?: Date | null, fechaFin?: Date | null): string {
    if (!fechaInicio || !fechaFin) return 'borrador';
    const ahora = new Date();
    if (ahora < fechaInicio) return 'programada';
    if (ahora > fechaFin) return 'finalizada';
    return 'activa';
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const bodegaId = searchParams.get('bodegaId');
    const estado = searchParams.get('estado');
    const where: { bodegaId?: string; estado?: string } = {};
    if (bodegaId) where.bodegaId = bodegaId;
    if (estado) where.estado = estado;
    try {
        const promocionesDB = await prisma.promocion.findMany({ where, orderBy: { createdAt: 'desc' } });
        const promociones = promocionesDB.map(p => ({
            ...p,
            estado: calcularEstado(p.fechaInicio, p.fechaFin),
        }));
        const activas = promociones.filter(p => p.estado === 'activa').length;
        return NextResponse.json({ ok: true, success: true, data: promociones, total: promociones.length, activas });
    } catch {
        return NextResponse.json({ ok: false, error: 'Error al obtener promociones' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { titulo, tipo, valor, bodegaId, descripcion, fechaInicio, fechaFin, productosAplicables } = body;
        if (!titulo || !tipo || !valor || !bodegaId) {
            return NextResponse.json({ ok: false, error: 'Faltan campos requeridos: titulo, tipo, valor, bodegaId' }, { status: 400 });
        }
        const promocion = await prisma.promocion.create({
            data: {
                titulo,
                tipo,
                valor: parseFloat(valor),
                bodegaId,
                descripcion: descripcion ?? undefined,
                estado: 'borrador',
                fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
                fechaFin: fechaFin ? new Date(fechaFin) : undefined,
                productosAplicables: productosAplicables ?? undefined,
            },
        });
        return NextResponse.json({ ok: true, success: true, data: promocion }, { status: 201 });
    } catch {
        return NextResponse.json({ ok: false, error: 'Error al crear promoción' }, { status: 500 });
    }
}
