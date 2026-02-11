import { readFile, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

interface Promocion {
    id?: string;
    bodegaId: string;
    nombre: string;
    tipo: "porcentaje" | "precio_fijo";
    valor: number;
    fechaInicio: string;
    fechaFin: string;
    aplicaA: "categoria" | "productos";
    categoriaProductos?: string[];
    productosIds?: string[];
    estado?: "activa" | "programada" | "finalizada";
    productosAfectados?: number;
    createdAt?: string;
    updatedAt?: string;
    activo?: boolean;
}

async function readPromociones() {
    try {
        const dataPath = path.join(process.cwd(), "data", "promociones.json");
        const data = await readFile(dataPath, "utf-8");
        return JSON.parse(data) as Promocion[];
    } catch {
        return [];
    }
}

async function writePromociones(promociones: Promocion[]) {
    const dataPath = path.join(process.cwd(), "data", "promociones.json");
    await writeFile(dataPath, JSON.stringify(promociones, null, 2));
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const promociones = await readPromociones();
        const promo = promociones.find((p) => p.id === id);

        if (!promo) {
            return Response.json(
                { ok: false, error: "Promoción no encontrada" },
                { status: 404 }
            );
        }

        return Response.json({
            ok: true,
            data: promo,
        });
    } catch (error) {
        console.error("Error leyendo promoción:", error);
        return Response.json(
            { ok: false, error: "Error leyendo promoción" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = (await request.json()) as Promocion;

        const promociones = await readPromociones();
        const index = promociones.findIndex((p) => p.id === id);

        if (index === -1) {
            return Response.json(
                { ok: false, error: "Promoción no encontrada" },
                { status: 404 }
            );
        }

        const updated: Promocion = {
            ...promociones[index],
            nombre: body.nombre || promociones[index].nombre,
            tipo: body.tipo || promociones[index].tipo,
            valor: body.valor !== undefined ? body.valor : promociones[index].valor,
            fechaInicio: body.fechaInicio || promociones[index].fechaInicio,
            fechaFin: body.fechaFin || promociones[index].fechaFin,
            aplicaA: body.aplicaA || promociones[index].aplicaA,
            categoriaProductos: body.categoriaProductos || promociones[index].categoriaProductos,
            productosIds: body.productosIds || promociones[index].productosIds,
            activo: body.activo !== undefined ? body.activo : promociones[index].activo,
            updatedAt: new Date().toISOString(),
        };

        promociones[index] = updated;
        await writePromociones(promociones);

        return Response.json({
            ok: true,
            data: updated,
        });
    } catch (error) {
        console.error("Error actualizando promoción:", error);
        return Response.json(
            { ok: false, error: "Error actualizando promoción" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const promociones = await readPromociones();
        const filtered = promociones.filter((p) => p.id !== id);

        if (filtered.length === promociones.length) {
            return Response.json(
                { ok: false, error: "Promoción no encontrada" },
                { status: 404 }
            );
        }

        await writePromociones(filtered);

        return Response.json({
            ok: true,
            message: "Promoción eliminada",
        });
    } catch (error) {
        console.error("Error eliminando promoción:", error);
        return Response.json(
            { ok: false, error: "Error eliminando promoción" },
            { status: 500 }
        );
    }
}
