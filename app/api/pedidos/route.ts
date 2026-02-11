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
  try {
    const body = (await request.json()) as Pedido;
    if (!body || !isNonEmptyString(body.bodegaId)) {
      return NextResponse.json(
        { ok: false, error: "bodegaId es requerido" },
        { status: 400 },
      );
    }

    const bodegaId = body.bodegaId.trim();

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { ok: false, error: "items debe ser un arreglo con al menos un item" },
        { status: 400 },
      );
    }

    const itemsValidos = body.items.every((item) => {
      const cantidad = Number((item as any).cantidad);
      const precio = Number((item as any).precio ?? (item as any).precio_cop ?? 0);
      return (
        item &&
        isNonEmptyString((item as any).productoId) &&
        Number.isFinite(cantidad) &&
        cantidad > 0 &&
        Number.isFinite(precio) &&
        precio >= 0
      );
    });

    if (!itemsValidos) {
      return NextResponse.json(
        { ok: false, error: "Cada item debe tener productoId, cantidad > 0 y precio válido" },
        { status: 400 },
      );
    }

    const datosEntrega = body.datosEntrega || {};
    const cliente = (body as any).cliente || {};
    const nombre = (datosEntrega as any).nombre ?? cliente.nombre;
    const telefono = (datosEntrega as any).telefono ?? cliente.telefono;
    const direccion = (datosEntrega as any).direccion ?? (body as any).direccion;

    if (!isNonEmptyString(nombre) || !isNonEmptyString(direccion)) {
      return NextResponse.json(
        {
          ok: false,
          error: "cliente.nombre y direccion son obligatorios",
        },
        { status: 400 },
      );
    }

    const pedidoId = body.pedidoId || buildPedidoId(bodegaId);

    const now = new Date().toISOString();
    const createdAt = body.createdAt || now;
    const updatedAt = now;

    const normalizedItems = body.items.map((item) => {
      const cantidad = Number((item as any).cantidad) || 0;
      const precio = Number((item as any).precio ?? (item as any).precio_cop ?? 0) || 0;
      return {
        ...item,
        cantidad,
        precio,
        precio_cop: (item as any).precio_cop ?? precio,
        subtotal: cantidad * precio,
      };
    });

    const total = normalizedItems.reduce((sum, item) => sum + (item.subtotal ?? 0), 0);

    // Validar cupón en servidor si fue aplicado
    if (body.coupon && body.coupon.code) {
      try {
        const cupones = await getCupones();
        const subtotalOriginal = total;
        const validation = validateCupon(cupones, body.coupon.code, body.bodegaId, subtotalOriginal);

        if (!validation.ok) {
          return NextResponse.json(
            { ok: false, error: `Cupón inválido: ${validation.reason}` },
            { status: 400 },
          );
        }
      } catch (err) {
        console.warn("No se pudo validar cupón en servidor, continuando...", err);
        // No fallar por cupones - continuar con el pedido
      }
    }

    const pedido = {
      ...body,
      id: (body as any).id || pedidoId,
      pedidoId,
      bodegaId,
      createdAt,
      updatedAt,
      estado: EstadoPedido.NUEVO,
      cliente: (body as any).cliente || { nombre, telefono },
      direccion: (body as any).direccion || direccion,
      items: normalizedItems,
      datosEntrega: {
        nombre,
        telefono,
        direccion,
        notas: (datosEntrega as any).notas ?? null,
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
        return NextResponse.json(
          { ok: false, error: "Archivo pedidos.json corrupto" },
          { status: 500 },
        );
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
      },
      { status: 201 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Error al procesar el pedido" },
      { status: 500 },
    );
  }
}
