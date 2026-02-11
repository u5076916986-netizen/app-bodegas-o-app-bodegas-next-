import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

type Incidencia = {
    id: string;
    pedidoId: string;
    repartidorId?: string | null;
    estado?: string | null;
    motivo: string;
    detalle?: string | null;
    source?: string | null;
    createdAt: string;
};

const FILE_PATH = path.join(process.cwd(), "data", "incidencias.json");

async function readIncidencias(): Promise<Incidencia[]> {
    try {
        const raw = await fs.readFile(FILE_PATH, "utf-8");
        return JSON.parse(raw) as Incidencia[];
    } catch (err: any) {
        if (err.code === "ENOENT") return [];
        throw err;
    }
}

async function writeIncidencias(incidencias: Incidencia[]) {
    await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
    await fs.writeFile(FILE_PATH, JSON.stringify(incidencias, null, 2), "utf-8");
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as Partial<Incidencia>;
        if (!body.pedidoId || !body.motivo) {
            return NextResponse.json(
                { ok: false, error: "pedidoId y motivo son obligatorios" },
                { status: 400 },
            );
        }

        const incidencias = await readIncidencias();
        const nueva: Incidencia = {
            id: randomUUID(),
            pedidoId: body.pedidoId,
            repartidorId: body.repartidorId ?? null,
            estado: body.estado ?? null,
            motivo: body.motivo,
            detalle: body.detalle ?? null,
            source: body.source ?? "repartidor",
            createdAt: new Date().toISOString(),
        };

        await writeIncidencias([...incidencias, nueva]);
        return NextResponse.json({ ok: true, data: nueva });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { ok: false, error: "Error guardando incidencia" },
            { status: 500 },
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const pedidoId = searchParams.get("pedidoId");
        const repartidorId = searchParams.get("repartidorId");

        const incidencias = await readIncidencias();
        const filtered = incidencias.filter((item) => {
            if (pedidoId && item.pedidoId !== pedidoId) return false;
            if (repartidorId && item.repartidorId !== repartidorId) return false;
            return true;
        });

        return NextResponse.json({ ok: true, data: filtered });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { ok: false, error: "Error leyendo incidencias" },
            { status: 500 },
        );
    }
}