import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeText } from "@/lib/normalize";

export const runtime = "nodejs";

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const q = (url.searchParams.get("q") || "").trim();
        const category = url.searchParams.get("category") || undefined;
        const bodegaId = url.searchParams.get("bodegaId") || undefined;
        const minPrice = url.searchParams.get("minPrice") ? Number(url.searchParams.get("minPrice")) : undefined;
        const maxPrice = url.searchParams.get("maxPrice") ? Number(url.searchParams.get("maxPrice")) : undefined;
        const sort = (url.searchParams.get("sort") || "relevancia").toLowerCase();
        const limit = Math.min(100, Number(url.searchParams.get("limit") || "50"));
        const offset = Number(url.searchParams.get("offset") || "0");

        // Build Prisma where clause
        const where: Record<string, unknown> = { estado: "activo" };
        if (bodegaId) where.bodegaId = bodegaId;
        if (category) where.categoria = category;
        if (minPrice !== undefined || maxPrice !== undefined) {
            const precioFilter: Record<string, number> = {};
            if (minPrice !== undefined) precioFilter.gte = minPrice;
            if (maxPrice !== undefined) precioFilter.lte = maxPrice;
            where.precio = precioFilter;
        }
        if (q.length >= 2) {
            where.OR = [
                { nombre: { contains: q, mode: "insensitive" } },
                { descripcion: { contains: q, mode: "insensitive" } },
                { categoria: { contains: q, mode: "insensitive" } },
                { sku: { contains: q, mode: "insensitive" } },
            ];
        }

        // Determine orderBy
        let orderBy: Record<string, string> = { nombre: "asc" };
        if (sort === "precio_asc") orderBy = { precio: "asc" };
        else if (sort === "precio_desc") orderBy = { precio: "desc" };

        const [productos, total] = await Promise.all([
            prisma.producto.findMany({
                where,
                orderBy,
                take: limit,
                skip: offset,
            }),
            prisma.producto.count({ where }),
        ]);

        // Get unique bodega IDs from results to fetch bodega names
        const bodegaIds = [...new Set(productos.map((p) => p.bodegaId))];
        const bodegas = await prisma.bodega.findMany({
            where: { id: { in: bodegaIds } },
            select: { id: true, nombre: true },
        });
        const bodegaMap = Object.fromEntries(bodegas.map((b) => [b.id, b.nombre]));

        const items = productos.map((p) => ({
            productId: p.id,
            nombre: p.nombre,
            categoria: p.categoria ?? null,
            precio: p.precio,
            stock: p.stock,
            bodegaId: p.bodegaId,
            bodegaNombre: bodegaMap[p.bodegaId] ?? null,
            imagenUrl: p.imagenUrl ?? null,
        }));

        // Facets
        const allProductos = await prisma.producto.findMany({
            where: { estado: "activo" },
            select: { categoria: true, bodegaId: true },
        });
        const categoriasSet = new Set(allProductos.map((p) => p.categoria).filter(Boolean));
        const bodegaIdsAll = [...new Set(allProductos.map((p) => p.bodegaId))];
        const bodegasAll = await prisma.bodega.findMany({
            where: { id: { in: bodegaIdsAll } },
            select: { id: true, nombre: true },
        });

        return NextResponse.json({
            ok: true,
            q,
            total,
            limit,
            offset,
            items,
            facets: {
                categorias: Array.from(categoriasSet).sort(),
                bodegas: bodegasAll.map((b) => ({ id: b.id, nombre: b.nombre })),
                zonas: [],
            },
            meta: {},
        });
    } catch (err) {
        console.error("[GET /api/buscar]", err);
        return NextResponse.json({ ok: false, error: "Error en búsqueda" }, { status: 500 });
    }
}
