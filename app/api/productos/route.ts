import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "fs";

export const runtime = "nodejs";

const DATA_FILE = join(process.cwd(), "data", "productos.json");

interface Producto {
    id: string;
    bodegaId: string;
    nombre: string;
    sku: string;
    categoria: string;
    precio: number;
    stock: number;
    activo: boolean;
    descripcion?: string;
    updatedAt: string;
}

async function readProductos(): Promise<Producto[]> {
    try {
        if (!existsSync(DATA_FILE)) {
            return [];
        }
        const data = await readFile(DATA_FILE, "utf-8");
        return JSON.parse(data);
    } catch {
        return [];
    }
}

async function writeProductos(productos: Producto[]): Promise<void> {
    await writeFile(DATA_FILE, JSON.stringify(productos, null, 2), "utf-8");
}

function generateId(): string {
    return `PROD_${Date.now()}`;
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const bodegaId = searchParams.get("bodegaId");

        const productos = await readProductos();

        if (bodegaId) {
            const filtered = productos.filter((p) => p.bodegaId === bodegaId);
            return NextResponse.json({
                ok: true,
                data: filtered,
                meta: {
                    total: filtered.length,
                    sinStock: filtered.filter((p) => p.stock === 0).length,
                },
            });
        }

        return NextResponse.json({
            ok: true,
            data: productos,
            meta: {
                total: productos.length,
                sinStock: productos.filter((p) => p.stock === 0).length,
            },
        });
    } catch (error) {
        return NextResponse.json(
            { ok: false, error: "Error reading productos" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { bodegaId, nombre, sku, categoria, precio, stock, activo, descripcion } = body;

        if (!bodegaId || !nombre || !sku || !categoria) {
            return NextResponse.json(
                { ok: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        const productos = await readProductos();

        const nuevoProducto: Producto = {
            id: generateId(),
            bodegaId,
            nombre,
            sku,
            categoria,
            precio: Number(precio) || 0,
            stock: Number(stock) || 0,
            activo: activo !== false,
            descripcion: descripcion || "",
            updatedAt: new Date().toISOString(),
        };

        productos.push(nuevoProducto);
        await writeProductos(productos);

        return NextResponse.json({
            ok: true,
            data: nuevoProducto,
        });
    } catch (error) {
        return NextResponse.json(
            { ok: false, error: "Error creating producto" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, bodegaId, nombre, sku, categoria, precio, stock, activo, descripcion } = body;

        if (!id) {
            return NextResponse.json(
                { ok: false, error: "Missing id" },
                { status: 400 }
            );
        }

        let productos = await readProductos();
        const index = productos.findIndex((p) => p.id === id);

        if (index === -1) {
            return NextResponse.json(
                { ok: false, error: "Producto not found" },
                { status: 404 }
            );
        }

        const updated: Producto = {
            ...productos[index],
            ...(bodegaId && { bodegaId }),
            ...(nombre && { nombre }),
            ...(sku && { sku }),
            ...(categoria && { categoria }),
            ...(precio !== undefined && { precio: Number(precio) }),
            ...(stock !== undefined && { stock: Number(stock) }),
            ...(activo !== undefined && { activo }),
            ...(descripcion !== undefined && { descripcion }),
            updatedAt: new Date().toISOString(),
        };

        productos[index] = updated;
        await writeProductos(productos);

        return NextResponse.json({
            ok: true,
            data: updated,
        });
    } catch (error) {
        return NextResponse.json(
            { ok: false, error: "Error updating producto" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { ok: false, error: "Missing id" },
                { status: 400 }
            );
        }

        let productos = await readProductos();
        const index = productos.findIndex((p) => p.id === id);

        if (index === -1) {
            return NextResponse.json(
                { ok: false, error: "Producto not found" },
                { status: 404 }
            );
        }

        productos.splice(index, 1);
        await writeProductos(productos);

        return NextResponse.json({
            ok: true,
            data: { id },
        });
    } catch (error) {
        return NextResponse.json(
            { ok: false, error: "Error deleting producto" },
            { status: 500 }
        );
    }
}
