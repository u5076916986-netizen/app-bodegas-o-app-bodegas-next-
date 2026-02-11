import { readFile, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

interface BulkProducto {
    nombre: string;
    sku: string;
    categoria: string;
    precio: number;
    stock: number;
    activo?: boolean;
    descripcion?: string;
}

interface BulkImportRequest {
    bodegaId: string;
    productos: BulkProducto[];
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as BulkImportRequest;
        const { bodegaId, productos } = body;

        if (!bodegaId) {
            return Response.json(
                { ok: false, error: "bodegaId requerido" },
                { status: 400 }
            );
        }

        if (!Array.isArray(productos) || productos.length === 0) {
            return Response.json(
                { ok: false, error: "Array de productos requerido" },
                { status: 400 }
            );
        }

        // Validar cada producto
        for (const prod of productos) {
            if (!prod.nombre || !prod.sku || !prod.categoria || !prod.precio) {
                return Response.json(
                    {
                        ok: false,
                        error: "Cada producto requiere: nombre, sku, categoria, precio",
                    },
                    { status: 400 }
                );
            }
        }

        // Leer productos existentes
        const dataPath = path.join(process.cwd(), "data", "productos.json");
        let existingProductos = [];

        try {
            const data = await readFile(dataPath, "utf-8");
            existingProductos = JSON.parse(data);
        } catch {
            existingProductos = [];
        }

        // Crear nuevos productos con IDs únicos
        const newProductos = productos.map((prod) => ({
            id: `PROD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            bodegaId,
            nombre: prod.nombre,
            sku: prod.sku,
            categoria: prod.categoria,
            precio: prod.precio,
            stock: prod.stock || 0,
            activo: prod.activo !== false,
            descripcion: prod.descripcion || "",
            updatedAt: new Date().toISOString(),
        }));

        // Fusionar y guardar
        const allProductos = [...existingProductos, ...newProductos];
        await writeFile(dataPath, JSON.stringify(allProductos, null, 2));

        return Response.json({
            ok: true,
            data: {
                imported: newProductos.length,
                total: allProductos.length,
                productos: newProductos,
            },
        });
    } catch (error) {
        console.error("Error en bulk import:", error);
        return Response.json(
            { ok: false, error: "Error procesando bulk import" },
            { status: 500 }
        );
    }
}
