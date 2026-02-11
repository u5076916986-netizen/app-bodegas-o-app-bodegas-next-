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

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const bodegaId = searchParams.get("bodegaId");

        let promociones = await readPromociones();

        if (bodegaId) {
            promociones = promociones.filter((p) => p.bodegaId === bodegaId);
        }

        // Determinar estado basado en fechas actuales
        const now = new Date();
        const withStatus = promociones.map((p) => {
            const inicio = new Date(p.fechaInicio);
            const fin = new Date(p.fechaFin);

            let estado: "activa" | "programada" | "finalizada";
            if (now < inicio) {
                estado = "programada";
            } else if (now > fin) {
                estado = "finalizada";
            } else {
                estado = "activa";
            }

            return { ...p, estado };
        });

        return Response.json({
            ok: true,
            data: withStatus,
            meta: {
                total: withStatus.length,
                activas: withStatus.filter((p) => p.estado === "activa").length,
                programadas: withStatus.filter((p) => p.estado === "programada").length,
                finalizadas: withStatus.filter((p) => p.estado === "finalizada").length,
            },
        });
    } catch (error) {
        console.error("Error leyendo promociones:", error);
        return Response.json(
            { ok: false, error: "Error leyendo promociones" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as Promocion;
        const { bodegaId, nombre, tipo, valor, fechaInicio, fechaFin, aplicaA } =
            body;

        // Validaciones
        if (!bodegaId || !nombre || !tipo || !valor || !fechaInicio || !fechaFin) {
            return Response.json(
                {
                    ok: false,
                    error:
                        "Faltan campos requeridos: bodegaId, nombre, tipo, valor, fechaInicio, fechaFin",
                },
                { status: 400 }
            );
        }

        if (!["porcentaje", "precio_fijo"].includes(tipo)) {
            return Response.json(
                { ok: false, error: "tipo debe ser 'porcentaje' o 'precio_fijo'" },
                { status: 400 }
            );
        }

        if (!["categoria", "productos"].includes(aplicaA || "")) {
            return Response.json(
                { ok: false, error: "aplicaA debe ser 'categoria' o 'productos'" },
                { status: 400 }
            );
        }

        const nuevaPromocion: Promocion = {
            id: `PROMO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            bodegaId,
            nombre,
            tipo,
            valor,
            fechaInicio,
            fechaFin,
            aplicaA,
            categoriaProductos: body.categoriaProductos || [],
            productosIds: body.productosIds || [],
            estado: "programada",
            productosAfectados: body.productosAfectados || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const promociones = await readPromociones();
        promociones.push(nuevaPromocion);
        await writePromociones(promociones);

        return Response.json({
            ok: true,
            data: nuevaPromocion,
        });
    } catch (error) {
        console.error("Error creando promoción:", error);
        return Response.json(
            { ok: false, error: "Error creando promoción" },
            { status: 500 }
        );
    }
}
