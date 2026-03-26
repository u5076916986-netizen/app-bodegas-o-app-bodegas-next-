import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const bodega = await prisma.bodega.findFirst({ where: { estado: 'activa' } });
        if (!bodega) {
            return NextResponse.json({ ok: false, error: 'No hay bodega activa' }, { status: 404 });
        }
        return NextResponse.json({ ok: true, bodegaId: bodega.id, bodega });
    } catch {
        return NextResponse.json({ ok: false, error: 'Error al obtener bodega' }, { status: 500 });
    }
}
