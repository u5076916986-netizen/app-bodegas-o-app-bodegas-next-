import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const bodegaId = searchParams.get('bodegaId');
    const categoria = searchParams.get('categoria');
    const precioMinimo = searchParams.get('precioMinimo');
    const precioMaximo = searchParams.get('precioMaximo');
    const activo = searchParams.get('activo');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    try {
        const where: Record<string, unknown> = {};
        if (bodegaId) where.bodegaId = bodegaId;
        if (categoria) where.categoria = categoria;
        if (activo !== null && activo !== undefined) {
            where.estado = activo === 'false' ? { not: 'activo' } : 'activo';
        }
        if (precioMinimo || precioMaximo) {
            const precioFilter: Record<string, number> = {};
            if (precioMinimo) precioFilter.gte = parseFloat(precioMinimo);
            if (precioMaximo) precioFilter.lte = parseFloat(precioMaximo);
            where.precio = precioFilter;
        }
        if (search) {
            where.OR = [
                { nombre: { contains: search, mode: 'insensitive' } },
                { descripcion: { contains: search, mode: 'insensitive' } },
            ];
        }

        const total = await prisma.producto.count({ where });
        const productos = await prisma.producto.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
            ok: true,
            success: true,
            data: productos,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch {
        return NextResponse.json({ ok: false, error: 'Error al obtener productos' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { nombre, categoria, precio, sku, stock, descripcion, imagenUrl, estado, bodegaId } = body;
        if (!nombre || precio === undefined || !bodegaId) {
            return NextResponse.json({ ok: false, error: 'nombre, precio y bodegaId son requeridos' }, { status: 400 });
        }
        const producto = await prisma.producto.create({
            data: {
                nombre,
                categoria: categoria ?? undefined,
                precio: parseFloat(precio),
                sku: sku ?? undefined,
                stock: stock !== undefined ? parseInt(stock) : 0,
                descripcion: descripcion ?? undefined,
                imagenUrl: imagenUrl ?? undefined,
                estado: estado ?? 'activo',
                bodegaId,
            },
        });
        return NextResponse.json({ ok: true, success: true, data: producto }, { status: 201 });
    } catch {
        return NextResponse.json({ ok: false, error: 'Error al crear producto' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...data } = body;
        if (!id) return NextResponse.json({ ok: false, error: 'id es requerido' }, { status: 400 });
        const producto = await prisma.producto.update({ where: { id }, data });
        return NextResponse.json({ ok: true, data: producto });
    } catch {
        return NextResponse.json({ ok: false, error: 'Error al actualizar producto' }, { status: 500 });
    }
}
