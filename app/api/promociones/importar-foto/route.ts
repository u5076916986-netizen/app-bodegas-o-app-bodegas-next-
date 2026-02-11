import { NextResponse } from "next/server";

export const runtime = "nodejs";

const buildMockPromos = (nowIso: string, endIso: string) => [
    {
        nombre: "2x1 en bebidas",
        tipo: "porcentaje",
        valor: 50,
        aplicaA: "categoria",
        categoriaProductos: ["Bebidas"],
        fechaInicio: nowIso,
        fechaFin: endIso,
        minSubtotal: 0,
    },
    {
        nombre: "Descuento $2.000 en aseo",
        tipo: "precio_fijo",
        valor: 2000,
        aplicaA: "categoria",
        categoriaProductos: ["Aseo"],
        fechaInicio: nowIso,
        fechaFin: endIso,
        minSubtotal: 15000,
    },
];

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const bodegaId = searchParams.get("bodegaId");

        if (!bodegaId) {
            return NextResponse.json(
                { ok: false, error: "bodegaId requerido" },
                { status: 400 },
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { ok: false, error: "Archivo requerido" },
                { status: 400 },
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const imageBase64 = buffer.toString("base64");
        const imageUrl = `data:${file.type || "image/jpeg"};base64,${imageBase64}`;

        const now = new Date();
        const end = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        const nowIso = now.toISOString();
        const endIso = end.toISOString();

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({
                ok: true,
                promociones: buildMockPromos(nowIso, endIso),
                imageUrl,
                source: "mock",
            });
        }

        return NextResponse.json({
            ok: true,
            promociones: buildMockPromos(nowIso, endIso),
            imageUrl,
            source: "mock_fallback",
        });
    } catch (err) {
        console.error("Error al importar promo:", err);
        return NextResponse.json(
            { ok: false, error: "Error al procesar la imagen" },
            { status: 500 },
        );
    }
}
