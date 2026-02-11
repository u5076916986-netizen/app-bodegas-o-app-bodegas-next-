import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { randomUUID } from "crypto";
import type { Cupon } from "@/lib/cupones";

const FILE_PATH = path.join(process.cwd(), "data", "cupones.json");

async function readCupones(): Promise<Cupon[]> {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf-8");
    return JSON.parse(raw) as Cupon[];
  } catch (err: any) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeCupones(cupones: Cupon[]) {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(cupones, null, 2), "utf-8");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bodegaId = searchParams.get("bodegaId");
    const activoParam = searchParams.get("activo");
    const filterActive =
      activoParam === "true"
        ? true
        : activoParam === "false"
        ? false
        : undefined;

    const cupones = await readCupones();
    const filtered = cupones.filter((cupon) => {
      if (bodegaId && cupon.bodegaId !== bodegaId) {
        return false;
      }
      if (filterActive !== undefined && cupon.active !== filterActive) {
        return false;
      }
      return true;
    });

    return NextResponse.json({ ok: true, cupones: filtered });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "No se pudo leer los cupones" },
      { status: 500 },
    );
  }
}

type CuponPayload = {
  id?: string;
  code: string;
  bodegaId?: string;
  type: "fixed" | "percent";
  value: number;
  minSubtotal?: number;
  active?: boolean;
  startDate?: string;
  endDate?: string;
};

const normalizeCode = (code: string) => code.trim().toUpperCase();

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CuponPayload;
    if (!body.code || !body.type || typeof body.value !== "number") {
      return NextResponse.json(
        { ok: false, error: "Faltan datos para crear el cupón" },
        { status: 400 },
      );
    }

    const cupones = await readCupones();
    const normalizedCode = normalizeCode(body.code);
    if (
      cupones.some(
        (c) =>
          c.code.toUpperCase() === normalizedCode &&
          c.bodegaId === (body.bodegaId ?? null),
      )
    ) {
      return NextResponse.json(
        { ok: false, error: "El código ya existe para esta bodega" },
        { status: 409 },
      );
    }

    const nuevo: Cupon = {
      id: randomUUID(),
      code: normalizedCode,
      bodegaId: body.bodegaId ?? null,
      type: body.type,
      value: body.value,
      minSubtotal: body.minSubtotal,
      active: body.active ?? true,
      startDate: body.startDate,
      endDate: body.endDate,
    };
    const actualizado = [...cupones, nuevo];
    await writeCupones(actualizado);
    return NextResponse.json({ ok: true, cupon: nuevo });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Error creando el cupón" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as CuponPayload;
    if (!body.id) {
      return NextResponse.json(
        { ok: false, error: "El cupón no existe" },
        { status: 400 },
      );
    }

    const cupones = await readCupones();
    const index = cupones.findIndex((c) => c.id === body.id);
    if (index < 0) {
      return NextResponse.json(
        { ok: false, error: "Cupón no encontrado" },
        { status: 404 },
      );
    }

    if (body.code !== undefined && !body.code.trim()) {
      return NextResponse.json(
        { ok: false, error: "El código no puede estar vacío" },
        { status: 400 },
      );
    }
    const normalizedCode = normalizeCode(body.code ?? cupones[index].code);
    if (
      cupones.some(
        (c, idx) =>
          idx !== index &&
          c.code.toUpperCase() === normalizedCode &&
          c.bodegaId === cupones[index].bodegaId,
      )
    ) {
      return NextResponse.json(
        { ok: false, error: "Código duplicado para esta bodega" },
        { status: 409 },
      );
    }

    const actualizado: Cupon = {
      ...cupones[index],
      code: normalizedCode,
      type: body.type ?? cupones[index].type,
      value: body.value ?? cupones[index].value,
      minSubtotal: body.minSubtotal ?? cupones[index].minSubtotal,
      active: body.active ?? cupones[index].active,
      startDate: body.startDate ?? cupones[index].startDate,
      endDate: body.endDate ?? cupones[index].endDate,
    };

    const copia = [...cupones];
    copia[index] = actualizado;

    await writeCupones(copia);
    return NextResponse.json({ ok: true, cupon: actualizado });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Error actualizando el cupón" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { id?: string };
    if (!body?.id) {
      return NextResponse.json(
        { ok: false, error: "Cupón inválido" },
        { status: 400 },
      );
    }

    const cupones = await readCupones();
    const filtrados = cupones.filter((c) => c.id !== body.id);
    if (filtrados.length === cupones.length) {
      return NextResponse.json(
        { ok: false, error: "Cupón no encontrado" },
        { status: 404 },
      );
    }

    await writeCupones(filtrados);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Error eliminando el cupón" },
      { status: 500 },
    );
  }
}
