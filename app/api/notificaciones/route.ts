import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
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

const FILE_PATH = path.join(process.cwd(), "data", "notificaciones.json");

async function readNotificaciones(): Promise<Notificacion[]> {
    try {
        const raw = await fs.readFile(FILE_PATH, "utf-8");
        return JSON.parse(raw) as Notificacion[];
    } catch (err: any) {
        if (err.code === "ENOENT") return [];
        throw err;
    }
}

async function writeNotificaciones(notificaciones: Notificacion[]) {
    await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
    await fs.writeFile(FILE_PATH, JSON.stringify(notificaciones, null, 2), "utf-8");
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const target = searchParams.get("target");
        const bodegaId = searchParams.get("bodegaId");

        const notificaciones = await readNotificaciones();
        const filtradas = notificaciones
            .filter((item) => {
                if (target && item.target !== target) return false;
                if (bodegaId && item.bodegaId !== bodegaId) return false;
                return true;
            })
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

        return NextResponse.json({ ok: true, data: filtradas });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { ok: false, error: "Error leyendo notificaciones" },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as Partial<Notificacion>;
        if (!body.titulo || !body.mensaje || !body.target) {
            return NextResponse.json(
                { ok: false, error: "Faltan campos obligatorios" },
                { status: 400 },
            );
        }

        const notificaciones = await readNotificaciones();
        const nuevo: Notificacion = {
            id: randomUUID(),
            bodegaId: body.bodegaId ?? null,
            titulo: body.titulo,
            mensaje: body.mensaje,
            target: body.target,
            createdAt: new Date().toISOString(),
            read: false,
        };

        await writeNotificaciones([...notificaciones, nuevo]);
        return NextResponse.json({ ok: true, data: nuevo });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { ok: false, error: "Error guardando notificación" },
            { status: 500 },
        );
    }
}