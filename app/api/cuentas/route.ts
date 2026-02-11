import { NextResponse } from "next/server";
import { getGananciasHoy, getGananciasSemana, readCuentas, readLedger } from "@/lib/ledger";

export const runtime = "nodejs";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const repartidorId = searchParams.get("repartidorId")?.trim();
        const tenderoId = searchParams.get("tenderoId")?.trim();

        const cuentas = await readCuentas();

        if (repartidorId) {
            const cuenta =
                cuentas.find(
                    (item) => item.accountId === repartidorId && item.tipo === "repartidor",
                ) ?? {
                    accountId: repartidorId,
                    tipo: "repartidor" as const,
                    puntos: 0,
                    ganancias: 0,
                    updatedAt: new Date().toISOString(),
                };

            const ledger = await readLedger();
            const gananciasHoy = getGananciasHoy(ledger, repartidorId);
            const gananciasSemana = getGananciasSemana(ledger, repartidorId);
            const pendientePago = cuenta.ganancias;

            return NextResponse.json({ ok: true, cuenta, gananciasHoy, gananciasSemana, pendientePago });
        }

        if (tenderoId) {
            const cuenta =
                cuentas.find(
                    (item) => item.accountId === tenderoId && item.tipo === "tendero",
                ) ?? {
                    accountId: tenderoId,
                    tipo: "tendero" as const,
                    puntos: 0,
                    ganancias: 0,
                    updatedAt: new Date().toISOString(),
                };

            return NextResponse.json({ ok: true, cuenta });
        }

        return NextResponse.json({ ok: true, cuentas });
    } catch (err) {
        console.error("Error al leer cuentas:", err);
        return NextResponse.json(
            { ok: false, error: "Error al leer cuentas" },
            { status: 500 },
        );
    }
}
