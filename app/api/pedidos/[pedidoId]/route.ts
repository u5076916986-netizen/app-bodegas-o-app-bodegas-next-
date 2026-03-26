import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

type Params = { params: Promise<{ pedidoId: string }> };

const ESTADOS_VALIDOS = [
    "nuevo", "recibido", "confirmado", "asignado", "en_bodega",
    "recogido", "en_ruta", "entregado", "cancelado",
];

const TRANSICIONES: Record<string, string[]> = {
    nuevo:      ["recibido", "confirmado", "cancelado"],
    recibido:   ["confirmado", "cancelado"],
    confirmado: ["asignado", "cancelado"],
    asignado:   ["en_bodega", "cancelado"],
    en_bodega:  ["recogido", "cancelado"],
    recogido:   ["en_ruta", "cancelado"],
    en_ruta:    ["entregado", "cancelado"],
    entregado:  [],
    cancelado:  [],
};

// action shortcuts del dashboard repartidor
const ACTION_TO_ESTADO: Record<string, string> = {
    take:           "asignado",
    start_delivery: "en_ruta",
    deliver:        "entregado",
};

type PrismaRecord = {
    id: string; createdAt: Date; nombre: string; telefono: string;
    direccion: string; items: unknown; total: number; estado: string;
    bodegaId: string; repartidorId: string | null;
};

const formatPedido = (p: PrismaRecord) => ({
    ...p,
    pedidoId: p.id,
    cliente: { nombre: p.nombre, telefono: p.telefono },
    datosEntrega: {
        nombre: p.nombre,
        telefono: p.telefono,
        direccion: p.direccion,
        notas: null,
    },
});

// ─── GET /api/pedidos/[pedidoId] ─────────────────────────────────────────────
export async function GET(_req: Request, { params }: Params) {
    try {
        const { pedidoId } = await params;
        const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
        if (!pedido) {
            return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
        }
        return NextResponse.json({ ok: true, pedido: formatPedido(pedido) });
    } catch (err) {
        console.error("[GET pedidoId]", err);
        return NextResponse.json({ ok: false, error: "Error al leer pedido" }, { status: 500 });
    }
}

// ─── PATCH /api/pedidos/[pedidoId] ───────────────────────────────────────────
export async function PATCH(request: Request, { params }: Params) {
    try {
        const { pedidoId } = await params;
        const body = (await request.json()) as {
            estado?: string;
            action?: string;
            repartidorId?: string | null;
            // repartidorNombre y repartidorTelefono se ignoran (no están en el schema)
        };

        const current = await prisma.pedido.findUnique({ where: { id: pedidoId } });
        if (!current) {
            return NextResponse.json({ ok: false, error: "Pedido no encontrado" }, { status: 404 });
        }

        const currentEstado = current.estado ?? "nuevo";

        // Resolver estado destino: body.estado directo o via action shortcut
        let nextEstado = body.estado;
        if (!nextEstado && body.action && ACTION_TO_ESTADO[body.action]) {
            nextEstado = ACTION_TO_ESTADO[body.action];
        }

        // Validar transición de estado
        if (nextEstado) {
            if (!ESTADOS_VALIDOS.includes(nextEstado)) {
                return NextResponse.json({ ok: false, error: "Estado inválido" }, { status: 400 });
            }
            const permitidos = TRANSICIONES[currentEstado] ?? [];
            if (!permitidos.includes(nextEstado)) {
                return NextResponse.json(
                    { ok: false, error: `No se puede pasar de "${currentEstado}" a "${nextEstado}"` },
                    { status: 400 }
                );
            }
        }

        // Construir campos a actualizar
        const data: { estado?: string; repartidorId?: string | null } = {};
        if (nextEstado) data.estado = nextEstado;
        if (body.repartidorId !== undefined) data.repartidorId = body.repartidorId;

        // Si no hay cambios, devolver estado actual
        if (Object.keys(data).length === 0) {
            return NextResponse.json({ ok: true, pedido: formatPedido(current) });
        }

        const updated = await prisma.pedido.update({ where: { id: pedidoId }, data });
        return NextResponse.json({ ok: true, pedido: formatPedido(updated) });
    } catch (err) {
        console.error("[PATCH pedidoId]", err);
        return NextResponse.json({ ok: false, error: "Error al actualizar pedido" }, { status: 500 });
    }
}
