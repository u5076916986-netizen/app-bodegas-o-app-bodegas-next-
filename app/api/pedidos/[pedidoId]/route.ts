import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { writeFile, readFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

type Params = { params: Promise<{ pedidoId: string }> };

const ESTADOS_VALIDOS = [
    "nuevo", "confirmado", "asignado", "en_bodega",
    "recogido", "en_ruta", "entregado", "cancelado",
];

const TRANSICIONES: Record<string, string[]> = {
    nuevo:      ["confirmado", "cancelado"],
    confirmado: ["asignado", "cancelado"],
    asignado:   ["en_bodega", "cancelado"],
    en_bodega:  ["recogido", "cancelado"],
    recogido:   ["en_ruta", "cancelado"],
    en_ruta:    ["entregado", "cancelado"],
    entregado:  [],
    cancelado:  [],
};

type PedidoRow = {
    id: string; createdAt: Date; nombre: string; telefono: string;
    direccion: string; items: unknown; total: number; estado: string;
    bodegaId: string; repartidorId?: string | null;
    repartidorNombre?: string | null; notas?: string | null; updatedAt?: Date;
};

const formatPedido = (p: PedidoRow) => ({
    ...p,
    pedidoId: p.id,
    cliente: { nombre: p.nombre, telefono: p.telefono },
    datosEntrega: { nombre: p.nombre, telefono: p.telefono, direccion: p.direccion, notas: p.notas ?? null },
});

const appendNotif = async (payload: {
    bodegaId?: string | null; titulo: string; mensaje: string;
    target: "tenderos" | "bodegas" | "repartidores" | "all";
}) => {
    const path = join(process.cwd(), "data", "notificaciones.json");
    try {
        const raw = await readFile(path, "utf-8").catch(() => "[]");
        const all = JSON.parse(raw);
        all.push({ id: randomUUID(), createdAt: new Date().toISOString(), read: false, ...payload });
        await writeFile(path, JSON.stringify(all, null, 2), "utf-8");
    } catch { /* silencioso */ }
};

// GET /api/pedidos/[pedidoId]
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const { pedidoId } = await params;

        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
        if (!token) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

        const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
        if (!pedido) return NextResponse.json({ ok: false, error: "Pedido no encontrado" }, { status: 404 });

        const role = token.rol as string;
        if (role === "BODEGUERO" && token.bodegaId && pedido.bodegaId !== token.bodegaId) {
            return NextResponse.json({ ok: false, error: "Sin permiso" }, { status: 403 });
        }

        return NextResponse.json({ ok: true, pedido: formatPedido(pedido as unknown as PedidoRow) });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ ok: false, error: "Error al leer pedido" }, { status: 500 });
    }
}

// PATCH /api/pedidos/[pedidoId]
export async function PATCH(request: NextRequest, { params }: Params) {
    try {
        const { pedidoId } = await params;

        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
        if (!token) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

        const role = token.rol as string;
        if (!["ADMIN", "BODEGUERO", "REPARTIDOR"].includes(role)) {
            return NextResponse.json({ ok: false, error: "Sin permiso" }, { status: 403 });
        }

        const body = await request.json() as {
            estado?: string;
            repartidorId?: string | null;
            repartidorNombre?: string | null;
            notas?: string;
        };

        const pedidoActual = await prisma.pedido.findUnique({ where: { id: pedidoId } });
        if (!pedidoActual) return NextResponse.json({ ok: false, error: "Pedido no encontrado" }, { status: 404 });

        if (role === "BODEGUERO" && token.bodegaId && pedidoActual.bodegaId !== token.bodegaId) {
            return NextResponse.json({ ok: false, error: "Sin permiso para este pedido" }, { status: 403 });
        }
        if (role === "REPARTIDOR") {
            const repartidorId = token.sub as string;
            if (pedidoActual.repartidorId && pedidoActual.repartidorId !== repartidorId) {
                return NextResponse.json({ ok: false, error: "Pedido asignado a otro repartidor" }, { status: 403 });
            }
        }

        if (body.estado) {
            if (!ESTADOS_VALIDOS.includes(body.estado)) {
                return NextResponse.json({ ok: false, error: "Estado inválido" }, { status: 400 });
            }
            const estadoActual = pedidoActual.estado || "nuevo";
            const permitidos = TRANSICIONES[estadoActual] || [];
            if (!permitidos.includes(body.estado)) {
                return NextResponse.json({
                    ok: false,
                    error: `Transición inválida: ${estadoActual} → ${body.estado}`,
                    estadosPermitidos: permitidos,
                }, { status: 400 });
            }
        }

        const data: Record<string, unknown> = {};
        if (body.estado !== undefined)           data.estado           = body.estado;
        if (body.repartidorId !== undefined)     data.repartidorId     = body.repartidorId;
        if (body.repartidorNombre !== undefined) data.repartidorNombre = body.repartidorNombre;
        if (body.notas !== undefined)            data.notas            = body.notas;

        const pedidoActualizado = await prisma.pedido.update({
            where: { id: pedidoId },
            data,
        });

        // Notificaciones asíncronas
        if (body.estado && body.estado !== pedidoActual.estado) {
            appendNotif({
                bodegaId: pedidoActual.bodegaId,
                titulo: "Estado del pedido actualizado",
                mensaje: `Pedido ${pedidoId} → ${body.estado.replace("_", " ")}`,
                target: "tenderos",
            });
            if (pedidoActualizado.repartidorId || body.repartidorId) {
                appendNotif({
                    bodegaId: pedidoActual.bodegaId,
                    titulo: body.estado === "asignado" ? "Nueva entrega asignada" : "Estado actualizado",
                    mensaje: body.estado === "asignado"
                        ? `Te asignaron el pedido ${pedidoId}.`
                        : `Pedido ${pedidoId} está ${body.estado.replace("_", " ")}.`,
                    target: "repartidores",
                });
            }
        }

        return NextResponse.json({ ok: true, pedido: formatPedido(pedidoActualizado as unknown as PedidoRow) });
    } catch (err) {
        console.error("Error PATCH /api/pedidos/[pedidoId]:", err);
        return NextResponse.json({ ok: false, error: "Error al actualizar pedido" }, { status: 500 });
    }
}
