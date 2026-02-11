import { NextResponse } from "next/server";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ bodegaId: string }> },
) {
    const { bodegaId } = await params;

    const mock = [
        {
            id: "c1",
            titulo: "10% en Abarrotes",
            descripcion: "Aplica en la categoría Abarrotes",
            tipo: "percent",
            valor: 10,
            startAt: "2026-02-01T00:00:00.000Z",
            endAt: "2026-02-28T00:00:00.000Z",
            status: "active",
            minTotal: 50,
        },
        {
            id: "p1",
            titulo: "Combo tienda",
            descripcion: "Promo por compra de 3 productos seleccionados",
            tipo: "promo",
            valor: 0,
            startAt: "2026-02-10T00:00:00.000Z",
            endAt: "2026-03-10T00:00:00.000Z",
            status: "scheduled",
            minTotal: 0,
        },
    ];

    return NextResponse.json({ bodegaId, items: mock });
}
