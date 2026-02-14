import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { appendPedido } from "@/lib/pedidos.server";
import type { Pedido } from "@/lib/pedidos";
import { EstadoPedido } from "@/lib/pedidos";
import { getCupones } from "@/lib/cupones.server";
import { validateCupon } from "@/lib/cupones";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

// Normalizar teléfono: remover espacios, dashes, paréntesis
const normalizePhone = (phone: string): string => {
  return phone.replace(/[\s\-\(\)]/g, "").trim();
};

const readPedidosFromFile = async () => {
  const dataPath = join(process.cwd(), "data", "pedidos.json");
  try {
    const raw = await readFile(dataPath, "utf-8");
    return JSON.parse(raw) as Array<Record<string, any>>;
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw err;
    }
    return [] as Array<Record<string, any>>;
  }
};

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const bodegaId = searchParams.get("bodegaId");
    const tenderoPhone = searchParams.get("tenderoPhone");
    const repartidorId = searchParams.get("repartidorId");
    const status = searchParams.get("status");
    const estado = searchParams.get("estado");
    const q = searchParams.get("q");

    const pedidos = await readPedidosFromFile();

    // Filtrar según el rol
    let filtered = pedidos;

    if (role === "bodega" && bodegaId) {
      // Bodega: filtrar por bodegaId
      filtered = pedidos.filter((p) => p.bodegaId === bodegaId);
    } else if (role === "tendero" && tenderoPhone) {
      // Tendero: filtrar por teléfono normalizado
      const normalized = normalizePhone(tenderoPhone);
      filtered = pedidos.filter((p) => {
        const pedidoPhone = normalizePhone(p.datosEntrega?.telefono || "");
        return pedidoPhone === normalized;
      });
    } else if (role === "repartidor") {
      // Repartidor: filtrar por estado relevante para entrega
      const statesForDelivery = [
        "listo_para_envio",
        "confirmado",
        "asignado",
        "en_bodega",
        "recogido",
        "en_camino",
        "en_ruta",
        "entregado",
      ];
      filtered = pedidos.filter((p) => statesForDelivery.includes(p.estado));

      // Si tiene repartidorId, filtrar por el actual
      if (repartidorId) {
        filtered = filtered.filter((p) => p.repartidorId === repartidorId);
      }

      // Filtro adicional por status si se proporciona
      if (status) {
        filtered = filtered.filter((p) => p.estado === status);
      }
    } else if (role === "admin") {
      // Admin: ver todos
      filtered = pedidos;
    } else {
      // Sin parámetros válidos: ver todos (compatibilidad backwards)
      filtered = pedidos;
    }

    // Filtro por bodegaId para vistas directas (sin role)
    if (bodegaId && role !== "bodega") {
      filtered = filtered.filter((p) => p.bodegaId === bodegaId);
    }

    // Filtro por repartidorId (independiente del rol)
    if (repartidorId && role !== "repartidor") {
      filtered = filtered.filter((p) => p.repartidorId === repartidorId);
    }

    // Filtro por estado
    if (estado) {
      filtered = filtered.filter((p) => p.estado === estado);
    }

    // Filtro por búsqueda (id, cliente, dirección)
    if (q) {
      const term = q.toLowerCase();
      filtered = filtered.filter((p) => {
        const id = `${p.id || p.pedidoId || ""}`.toLowerCase();
        const cliente = `${p.cliente?.nombre || p.datosEntrega?.nombre || ""}`.toLowerCase();
        const direccion = `${p.direccion || p.datosEntrega?.direccion || ""}`.toLowerCase();
        return id.includes(term) || cliente.includes(term) || direccion.includes(term);
      });
    }

    // Ordenar más recientes primero
    filtered.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    return NextResponse.json({ ok: true, pedidos: filtered });
  } catch (err) {
    console.error(err);
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { ok: false, error: "Archivo pedidos.json corrupto" },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "Error al leer pedidos" },
      { status: 500 },
    );
  }
}

const buildPedidoId = (bodegaId: string) => {
  const cleaned = (bodegaId || "").trim() || "BOD";
  const suffix = Date.now().toString().slice(-6);
  return `PED_${cleaned}_${suffix}`;
};

export async function POST(request: Request) {
  const requestId = randomUUID();

  const respondError = (
    status: number,
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) =>
    NextResponse.json(
      {
        ok: false,
        code,
        message,
        details,
        requestId,
      },
      { status },
    );

  try {
    const body = (await request.json()) as Pedido & { minimoPedido?: number };
    if (!body || !isNonEmptyString(body.bodegaId)) {
      console.error("[pedido]", requestId, "VALIDATION_ERROR", {
        reason: "bodegaId missing",
      });
      return respondError(400, "VALIDATION_ERROR", "bodegaId es requerido");
    }

    const bodegaId = body.bodegaId.trim();

    if (!Array.isArray(body.items) || body.items.length === 0) {
      console.error("[pedido]", requestId, "VALIDATION_ERROR", {
        reason: "items empty",
      });
      return respondError(
        400,
        "VALIDATION_ERROR",
        "items debe ser un arreglo con al menos un item",
      );
    }

    const itemsValidos = body.items.every((item) => {
      const raw = item as Record<string, unknown>;
      const cantidad = Number(raw.cantidad);
      const precio = Number(raw.precio ?? raw.precio_cop ?? 0);
      return (
        item &&
        isNonEmptyString(raw.productoId) &&
        Number.isFinite(cantidad) &&
        cantidad > 0 &&
        Number.isFinite(precio) &&
        precio >= 0
      );
    });

    if (!itemsValidos) {
      console.error("[pedido]", requestId, "VALIDATION_ERROR", {
        reason: "invalid items",
      });
      return respondError(
        400,
        "VALIDATION_ERROR",
        "Cada item debe tener productoId, cantidad > 0 y precio válido",
      );
    }

    const datosEntrega = body.datosEntrega || {};
    const cliente = (body as Record<string, unknown>).cliente as Record<string, unknown> | undefined;
    const nombre = (datosEntrega as Record<string, unknown>).nombre ?? cliente?.nombre;
    const telefono = (datosEntrega as Record<string, unknown>).telefono ?? cliente?.telefono;
    const direccion =
      (datosEntrega as Record<string, unknown>).direccion ??
      (body as Record<string, unknown>).direccion;

    if (!isNonEmptyString(nombre) || !isNonEmptyString(direccion) || !isNonEmptyString(telefono)) {
      console.error("[pedido]", requestId, "VALIDATION_ERROR", {
        reason: "missing delivery data",
      });
      return respondError(
        400,
        "VALIDATION_ERROR",
        "nombre, telefono y direccion son obligatorios",
      );
    }

    const pedidoId = body.pedidoId || buildPedidoId(bodegaId);

    const now = new Date().toISOString();
    const createdAt = body.createdAt || now;
    const updatedAt = now;

    const normalizedItems = body.items.map((item) => {
      const raw = item as Record<string, unknown>;
      const cantidad = Number(raw.cantidad) || 0;
      const precio = Number(raw.precio ?? raw.precio_cop ?? 0) || 0;
      return {
        ...item,
        cantidad,
        precio,
        precio_cop: raw.precio_cop ?? precio,
        subtotal: cantidad * precio,
      };
    });

    const total = normalizedItems.reduce((sum, item) => sum + (item.subtotal ?? 0), 0);
    const minimoPedido = Number(body.minimoPedido ?? 0) || 0;
    if (minimoPedido > 0 && total < minimoPedido) {
      console.error("[pedido]", requestId, "MIN_ORDER_NOT_MET", {
        minimoPedido,
        total,
      });
      return respondError(
        422,
        "MIN_ORDER_NOT_MET",
        "El pedido no alcanza el minimo de compra",
        { minimoPedido, total },
      );
    }

    // Validar cupón en servidor si fue aplicado
    if (body.coupon && body.coupon.code) {
      try {
        const cupones = await getCupones();
        const subtotalOriginal = total;
        const validation = validateCupon(cupones, body.coupon.code, body.bodegaId, subtotalOriginal);

        if (!validation.ok) {
          console.error("[pedido]", requestId, "COUPON_INVALID", {
            reason: validation.reason,
          });
          return respondError(
            400,
            "COUPON_INVALID",
            `Cupon invalido: ${validation.reason}`,
          );
        }
      } catch (err) {
        console.warn("No se pudo validar cupón en servidor, continuando...", err);
        // No fallar por cupones - continuar con el pedido
      }
    }

    const idValue = (body as Record<string, unknown>).id;
    const normalizedId = isNonEmptyString(idValue) ? idValue : pedidoId;

    const rawNotas = (datosEntrega as Record<string, unknown>).notas;
    const notas = isNonEmptyString(rawNotas) ? rawNotas : null;

    const normalizedDireccion = direccion;

    const pedido = {
      ...body,
      id: normalizedId,
      pedidoId,
      bodegaId,
      createdAt,
      updatedAt,
      estado: EstadoPedido.NUEVO,
      cliente: (body as Record<string, unknown>).cliente || { nombre, telefono },
      direccion: normalizedDireccion,
      items: normalizedItems,
      datosEntrega: {
        nombre,
        telefono,
        direccion,
        notas,
      },
      total,
      totalOriginal: total,
      discount: 0,
      repartidorId: body.repartidorId ?? null,
      repartidorNombre: body.repartidorNombre ?? null,
    };

    try {
      await appendPedido(pedido);
    } catch (err) {
      if (err instanceof SyntaxError) {
        console.error("[pedido]", requestId, "FILE_CORRUPT");
        return respondError(500, "FILE_CORRUPT", "Archivo pedidos.json corrupto");
      }
      throw err;
    }

    await appendNotificacion({
      bodegaId,
      titulo: "Nuevo pedido recibido",
      mensaje: `Pedido ${pedidoId} listo para confirmar.`,
      target: "bodegas",
    });

    await appendNotificacion({
      bodegaId,
      titulo: "Pedido creado",
      mensaje: `Tu pedido ${pedidoId} fue registrado y está en preparación.`,
      target: "tenderos",
    });

    return NextResponse.json(
      {
        ok: true,
        pedido,
        requestId,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[pedido]", requestId, "INTERNAL_ERROR", err);
    return respondError(500, "INTERNAL_ERROR", "Error al procesar el pedido");
  }
}
