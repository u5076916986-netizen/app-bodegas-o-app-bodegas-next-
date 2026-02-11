import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { randomUUID } from "crypto";
import type { Anuncio, Placement } from "@/lib/anuncios";

const FILE_PATH = path.join(process.cwd(), "data", "anuncios.json");

async function readAnuncios(): Promise<Anuncio[]> {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf-8");
    return JSON.parse(raw) as Anuncio[];
  } catch (err: any) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeAnuncios(anuncios: Anuncio[]) {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(anuncios, null, 2), "utf-8");
}

const ALLOWED_PLACEMENTS: Placement[] = ["home", "catalogo", "carrito", "confirmar"];
const isValidPlacement = (value: string | null): value is Placement =>
  value !== null && ALLOWED_PLACEMENTS.includes(value as Placement);

const nowIso = () => new Date().toISOString();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const placement = searchParams.get("placement");
    if (!isValidPlacement(placement)) {
      return NextResponse.json(
        { ok: false, error: "Placement inválido" },
        { status: 400 },
      );
    }

    const bodegaId = searchParams.get("bodegaId");
    const activoParam = searchParams.get("activo");
    const filterActive =
      activoParam === "true"
        ? true
        : activoParam === "false"
        ? false
        : undefined;

    const anuncios = await readAnuncios();
    const ahora = nowIso();
    const filtrados = anuncios
      .filter((anuncio) => {
        if (!anuncio.placements.includes(placement)) return false;
        if (bodegaId && anuncio.bodegaId !== bodegaId) return false;
        if (filterActive !== undefined && anuncio.activo !== filterActive)
          return false;
        if (anuncio.startDate && anuncio.startDate > ahora) return false;
        if (anuncio.endDate && anuncio.endDate < ahora) return false;
        return true;
      })
      .sort((a, b) => b.prioridad - a.prioridad);

    return NextResponse.json({ ok: true, anuncios: filtrados });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Failed to read anuncios" },
      { status: 500 },
    );
  }
}

type AnuncioPayload = {
  id?: string;
  bodegaId?: string;
  titulo: string;
  imagenUrl: string;
  activo?: boolean;
  prioridad?: number;
  placements?: Placement[];
  ctaTexto?: string;
  ctaHref?: string;
  startDate?: string;
  endDate?: string;
};

const sanitizePlacements = (input: Placement[] | undefined): Placement[] => {
  if (!input) return [];
  return input.filter((placement) => ALLOWED_PLACEMENTS.includes(placement));
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnuncioPayload;
    if (!body.titulo || !body.imagenUrl || !body.placements?.length) {
      return NextResponse.json(
        { ok: false, error: "Faltan campos obligatorios" },
        { status: 400 },
      );
    }

    const anuncios = await readAnuncios();
    const nuevo: Anuncio = {
      id: randomUUID(),
      titulo: body.titulo,
      bodegaId: body.bodegaId ?? null,
      imagenUrl: body.imagenUrl,
      activo: body.activo ?? true,
      prioridad: body.prioridad ?? 0,
      placements: sanitizePlacements(body.placements),
      ctaTexto: body.ctaTexto,
      ctaHref: body.ctaHref,
      startDate: body.startDate,
      endDate: body.endDate,
    };
    await writeAnuncios([...anuncios, nuevo]);
    return NextResponse.json({ ok: true, anuncio: nuevo });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Error guardando anuncio" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as AnuncioPayload;
    if (!body.id) {
      return NextResponse.json(
        { ok: false, error: "Falta el id del anuncio" },
        { status: 400 },
      );
    }

    const anuncios = await readAnuncios();
    const idx = anuncios.findIndex((item) => item.id === body.id);
    if (idx < 0) {
      return NextResponse.json(
        { ok: false, error: "Anuncio no encontrado" },
        { status: 404 },
      );
    }

    const actualizado: Anuncio = {
      ...anuncios[idx],
      titulo: body.titulo ?? anuncios[idx].titulo,
      imagenUrl: body.imagenUrl ?? anuncios[idx].imagenUrl,
      bodegaId: body.bodegaId ?? anuncios[idx].bodegaId,
      activo: body.activo ?? anuncios[idx].activo,
      prioridad: body.prioridad ?? anuncios[idx].prioridad,
      placements: sanitizePlacements(body.placements ?? anuncios[idx].placements),
      ctaTexto: body.ctaTexto ?? anuncios[idx].ctaTexto,
      ctaHref: body.ctaHref ?? anuncios[idx].ctaHref,
      startDate: body.startDate ?? anuncios[idx].startDate,
      endDate: body.endDate ?? anuncios[idx].endDate,
    };

    const copia = [...anuncios];
    copia[idx] = actualizado;
    await writeAnuncios(copia);

    return NextResponse.json({ ok: true, anuncio: actualizado });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Error actualizando anuncio" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { id?: string };
    if (!body?.id) {
      return NextResponse.json(
        { ok: false, error: "Falta el id del anuncio" },
        { status: 400 },
      );
    }

    const anuncios = await readAnuncios();
    const filtrados = anuncios.filter((item) => item.id !== body.id);
    if (filtrados.length === anuncios.length) {
      return NextResponse.json(
        { ok: false, error: "Anuncio no encontrado" },
        { status: 404 },
      );
    }

    await writeAnuncios(filtrados);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Error eliminando anuncio" },
      { status: 500 },
    );
  }
}
