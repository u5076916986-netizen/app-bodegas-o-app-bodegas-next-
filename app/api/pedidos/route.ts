import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

// Normalizar teléfono: remover espacios, dashes, paréntesis
const normalizePhone = (phone: string): string => {
  return phone.replace(/[\s\-\(\)]/g, "").trim();
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


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || searchParams.get("pedidoId");
    const role = searchParams.get("role");
    const bodegaId = searchParams.get("bodegaId");
    const tenderoPhone = searchParams.get("tenderoPhone");
    const estado = searchParams.get("estado");
    const q = searchParams.get("q");

    if (id) {
      const pedido = await prisma.pedido.findUnique({ where: { id } });
      if (!pedido) {
        return Response.json({ ok: false, error: "Pedido no encontrado" }, { status: 404 });
      }
      return Response.json({ ok: true, pedido: formatPedido(pedido) });
    }

    const where: Record<string, unknown> = {};

    if (role === "bodega" && bodegaId) {
      where.bodegaId = bodegaId;
    }

    if (role === "tendero" && tenderoPhone) {
      where.telefono = normalizePhone(tenderoPhone);
    }

    if (bodegaId && role !== "bodega") {
      where.bodegaId = bodegaId;
    }

    if (estado) {
      where.estado = estado;
    }

    if (q) {
      where.OR = [
        { id: { contains: q, mode: "insensitive" } },
        { nombre: { contains: q, mode: "insensitive" } },
        { direccion: { contains: q, mode: "insensitive" } },
        { telefono: { contains: q, mode: "insensitive" } },
      ];
    }

    const pedidos = await prisma.pedido.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ ok: true, pedidos: pedidos.map(formatPedido) });
  } catch (err) {
    console.error(err);
    return Response.json(
      { success: false, message: "Error al guardar pedido" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const rawItems = Array.isArray(body.items) ? body.items : [];
    const datosEntrega = (body.datosEntrega as Record<string, unknown>) || {};
    const cliente = (body.cliente as Record<string, unknown>) || {};

    const nombre =
      (datosEntrega.nombre as string | undefined) ??
      (cliente.nombre as string | undefined) ??
      (body.nombre as string | undefined);
    const telefono =
      (datosEntrega.telefono as string | undefined) ??
      (cliente.telefono as string | undefined) ??
      (body.telefono as string | undefined);
    const direccion =
      (datosEntrega.direccion as string | undefined) ??
      (body.direccion as string | undefined);

    const bodegaId = isNonEmptyString(body.bodegaId) ? body.bodegaId.trim() : "";
    if (!bodegaId) {
      return Response.json(
        { success: false, message: "bodegaId es requerido" },
        { status: 400 },
      );
    }

    if (!isNonEmptyString(nombre) || !isNonEmptyString(telefono) || !isNonEmptyString(direccion)) {
      return Response.json(
        { success: false, message: "nombre, telefono y direccion son obligatorios" },
        { status: 400 },
      );
    }

    const normalizedItems = rawItems.map((item) => {
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

    const computedTotal = normalizedItems.reduce((sum, item) => sum + (item.subtotal ?? 0), 0);
    const total = isPositiveNumber(body.total) ? Number(body.total) : computedTotal;

    const nuevoPedido = await prisma.pedido.create({
      data: {
        nombre: nombre.trim(),
        telefono: normalizePhone(telefono),
        direccion: direccion.trim(),
        items: normalizedItems,
        total,
        bodegaId,
      },
    });


    return Response.json(
      {
        success: true,
        pedidoId: nuevoPedido.id,
        pedido: formatPedido(nuevoPedido),
      },
      { status: 201 },
    );
  } catch (err) {
    console.error(err);
    return Response.json(
      { success: false, message: "Error al guardar pedido" },
      { status: 500 },
    );
  }
}

type PedidoRecord = {
  id: string;
  createdAt: Date;
  nombre: string;
  telefono: string;
  direccion: string;
  items: unknown;
  total: number;
  estado: string;
  bodegaId: string;
};

const formatPedido = (pedido: PedidoRecord) => {
  return {
    ...pedido,
    pedidoId: pedido.id,
    cliente: {
      nombre: pedido.nombre,
      telefono: pedido.telefono,
    },
    datosEntrega: {
      nombre: pedido.nombre,
      telefono: pedido.telefono,
      direccion: pedido.direccion,
      notas: null,
    },
  };
};
