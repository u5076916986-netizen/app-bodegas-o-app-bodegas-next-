import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
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

export const runtime = "nodejs";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { active?: boolean };

    const cupones = await readCupones();
    const index = cupones.findIndex((c) => c.id === id);

    if (index === -1) {
      return NextResponse.json(
        { ok: false, error: "Cupón no encontrado" },
        { status: 404 },
      );
    }

    if (body.active !== undefined) {
      cupones[index].active = body.active;
    }

    await writeCupones(cupones);

    return NextResponse.json({ ok: true, cupon: cupones[index] });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Error al actualizar cupón" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const cupones = await readCupones();
    const filtered = cupones.filter((c) => c.id !== id);

    if (filtered.length === cupones.length) {
      return NextResponse.json(
        { ok: false, error: "Cupón no encontrado" },
        { status: 404 },
      );
    }

    await writeCupones(filtered);

    return NextResponse.json({ ok: true, message: "Cupón eliminado" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Error al eliminar cupón" },
      { status: 500 },
    );
  }
}
