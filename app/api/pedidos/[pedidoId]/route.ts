import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { applyLedgerForPedido } from "@/lib/ledger";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

type Notificacion = {
  id: string;
  bodegaId?: string | null;
  titulo: string;
  mensaje: string;
  target: "tenderos" | "bodegas" | "repartidores" | "all";
  createdAt: string;
  read?: boolean;
};

const NOTIF_PATH = join(process.cwd(), "data", "notificaciones.json");

const appendNotificacion = async (payload: Omit<Notificacion, "id" | "createdAt" | "read">) => {
  try {
    const raw = await readFile(NOTIF_PATH, "utf-8");
    const current = JSON.parse(raw) as Notificacion[];
    const nuevo: Notificacion = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      read: false,
      ...payload,
    };
    await writeFile(NOTIF_PATH, JSON.stringify([...current, nuevo], null, 2), "utf-8");
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      const nuevo: Notificacion = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        read: false,
        ...payload,
      };
      await writeFile(NOTIF_PATH, JSON.stringify([nuevo], null, 2), "utf-8");
      return;
    }
    console.warn("No se pudo guardar notificación", err);
  }
};

type Params = {
  params: Promise<{ pedidoId: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  try {
    const { pedidoId } = await params;
    const dataPath = join(process.cwd(), "data", "pedidos.json");
    const raw = await readFile(dataPath, "utf-8");
    const pedidos = JSON.parse(raw) as Array<Record<string, any>>;
    const pedido = pedidos.find(
      (p) => p?.id === pedidoId || p?.pedidoId === pedidoId,
    );

    if (!pedido) {
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, pedido });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Error al leer pedido" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { pedidoId } = await params;
    const body = (await request.json()) as {
      estado?: string;
      repartidorId?: string | null;
      repartidorNombre?: string | null;
      repartidorTelefono?: string | null;
    };

    const estadosPermitidos = [
      "nuevo",
      "confirmado",
      "asignado",
      "en_bodega",
      "recogido",
      "en_ruta",
      "entregado",
      "cancelado",
    ];

    const transicionesPermitidas: Record<string, string[]> = {
      nuevo: ["confirmado", "cancelado"],
      confirmado: ["asignado", "cancelado"],
      asignado: ["en_bodega", "cancelado"],
      en_bodega: ["recogido", "cancelado"],
      recogido: ["en_ruta", "cancelado"],
      en_ruta: ["entregado", "cancelado"],
      entregado: [],
      cancelado: [],
    };

    // Validar estado si se proporciona
    if (body.estado && !estadosPermitidos.includes(body.estado)) {
      return NextResponse.json(
        { ok: false, error: "Estado inválido" },
        { status: 400 },
      );
    }

    const dataPath = join(process.cwd(), "data", "pedidos.json");
    const raw = await readFile(dataPath, "utf-8");
    const pedidos = JSON.parse(raw) as Array<Record<string, any>>;

    const index = pedidos.findIndex(
      (p) => p?.id === pedidoId || p?.pedidoId === pedidoId,
    );

    if (index === -1) {
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 404 },
      );
    }

    const currentEstado = String(pedidos[index]?.estado ?? "nuevo");

    if (body.estado) {
      const allowed = transicionesPermitidas[currentEstado] || [];
      if (!allowed.includes(body.estado)) {
        return NextResponse.json(
          { ok: false, error: "Transición de estado inválida" },
          { status: 400 },
        );
      }
    }

    const nextEstado = body.estado || currentEstado;

    const prevPedido = pedidos[index];
    const nextPedido = {
      ...pedidos[index],
      ...(body.estado && { estado: body.estado }),
      ...(body.repartidorId !== undefined && { repartidorId: body.repartidorId }),
      ...(body.repartidorNombre !== undefined && { repartidorNombre: body.repartidorNombre }),
      ...(body.repartidorTelefono !== undefined && { repartidorTelefono: body.repartidorTelefono }),
      updatedAt: new Date().toISOString(),
    } as Record<string, any>;

    if (nextPedido.estado === "entregado" && !nextPedido.ledgerApplied) {
      const ledgerResult = await applyLedgerForPedido(nextPedido);
      if (ledgerResult?.entry) {
        nextPedido.ledgerApplied = true;
        nextPedido.ledgerAppliedAt = ledgerResult.entry.createdAt;
      }
    }

    pedidos[index] = nextPedido;

    try {
      await writeFile(
        dataPath,
        JSON.stringify(pedidos, null, 2),
        "utf-8",
      );
    } catch (err) {
      console.error("Error al escribir pedidos.json:", err);
      return NextResponse.json(
        { ok: false, error: "Error al guardar pedido" },
        { status: 500 },
      );
    }

    const repartidorAsignado =
      body.repartidorId !== undefined &&
      body.repartidorId !== prevPedido?.repartidorId &&
      body.repartidorId;

    if (body.estado && body.estado !== currentEstado) {
      await appendNotificacion({
        bodegaId: nextPedido.bodegaId ?? null,
        titulo: "Actualización de pedido",
        mensaje: `Pedido ${nextPedido.pedidoId || nextPedido.id} ahora está ${nextEstado.replace("_", " ")}.`,
        target: "tenderos",
      });

      if (nextPedido.repartidorId) {
        await appendNotificacion({
          bodegaId: nextPedido.bodegaId ?? null,
          titulo: nextEstado === "asignado" ? "Nueva entrega asignada" : "Estado actualizado",
          mensaje:
            nextEstado === "asignado"
              ? `Te asignaron el pedido ${nextPedido.pedidoId || nextPedido.id}.`
              : `Pedido ${nextPedido.pedidoId || nextPedido.id} ahora está ${nextEstado.replace("_", " ")}.`,
          target: "repartidores",
        });
      }
    }

    if (repartidorAsignado) {
      await appendNotificacion({
        bodegaId: nextPedido.bodegaId ?? null,
        titulo: "Nueva entrega asignada",
        mensaje: `Te asignaron el pedido ${nextPedido.pedidoId || nextPedido.id}.`,
        target: "repartidores",
      });
    }

    return NextResponse.json({ ok: true, pedido: pedidos[index] });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Error al actualizar pedido" },
      { status: 500 },
    );
  }
}
