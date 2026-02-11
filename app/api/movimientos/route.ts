import { NextResponse } from "next/server";
import { addMovimientoRedime, getPuntosBalance, readMovimientos } from "@/lib/ledger";

export const runtime = "nodejs";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tenderoId = searchParams.get("tenderoId") || "";
        const bodegaId = searchParams.get("bodegaId");

        if (!tenderoId) {
            return NextResponse.json(
                { ok: false, error: "tenderoId requerido" },
                { status: 400 },
            );
        }

        const movimientos = await readMovimientos();
        const filtered = movimientos.filter((mov) => mov.tenderoId === tenderoId);
        const scoped = bodegaId ? filtered.filter((mov) => mov.bodegaId === bodegaId) : filtered;
        const balance = scoped.reduce((sum, mov) => sum + mov.puntos, 0);

        return NextResponse.json({ ok: true, movimientos: scoped, balance });
    } catch (err) {
        console.error("Error leyendo movimientos:", err);
        return NextResponse.json(
            { ok: false, error: "Error leyendo movimientos" },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as {
            tenderoId?: string;
            puntos?: number;
            pedidoId?: string;
            bodegaId?: string;
        };

        const tenderoId = body.tenderoId?.trim() || "";
        const puntos = Number(body.puntos ?? 0);

        if (!tenderoId || !Number.isFinite(puntos) || puntos <= 0) {
            return NextResponse.json(
                { ok: false, error: "Datos inválidos" },
                { status: 400 },
            );
        }

        const result = await addMovimientoRedime({
            tenderoId,
            puntos,
            pedidoId: body.pedidoId,
            bodegaId: body.bodegaId,
        });

        if (!result.ok) {
            return NextResponse.json(
                { ok: false, error: result.error },
                { status: 400 },
            );
        }

        const balance = await getPuntosBalance(tenderoId, body.bodegaId);
        return NextResponse.json({ ok: true, balance });
    } catch (err) {
        console.error("Error redimiendo puntos:", err);
        return NextResponse.json(
            { ok: false, error: "Error redimiendo puntos" },
            { status: 500 },
        );
    }
}
