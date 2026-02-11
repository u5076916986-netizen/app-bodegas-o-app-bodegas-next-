import { NextResponse } from "next/server";

export const runtime = "nodejs";

const buildMockProductos = () => [
    {
        nombre: "Arroz 1kg",
        categoria: "Alimentos",
        precio_cop: 4200,
        stock: 24,
        unidad: "unidad",
        sku: "MOCK-ARROZ-1KG",
        confidence: 0.92,
    },
    {
        nombre: "Aceite 900ml",
        categoria: "Alimentos",
        precio_cop: 9800,
        stock: 12,
        unidad: "unidad",
        sku: "MOCK-ACEITE-900",
        confidence: 0.78,
    },
    {
        nombre: "Detergente 500g",
        categoria: "Aseo",
        precio_cop: 6500,
        stock: 18,
        unidad: "unidad",
        sku: "MOCK-DETER-500",
        confidence: 0.55,
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

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({
                ok: true,
                productos: buildMockProductos(),
                source: "mock",
            });
        }

        const origin = new URL(request.url).origin;
        const iaResponse = await fetch(`${origin}/api/ia/extraer-productos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64 }),
        });

        if (!iaResponse.ok) {
            return NextResponse.json({
                ok: true,
                productos: buildMockProductos(),
                source: "mock_fallback",
            });
        }

        const data = await iaResponse.json();
        const productos = Array.isArray(data?.productos) ? data.productos : [];

        const normalized = productos.map((p: any, index: number) => ({
            nombre: String(p?.nombre ?? `Producto ${index + 1}`).trim(),
            categoria: String(p?.categoria ?? "General").trim(),
            precio_cop: Number(p?.precio_cop ?? 0),
            stock: Number(p?.stock ?? 0),
            unidad: String(p?.unidad ?? "unidad").trim(),
            sku: p?.sku ? String(p.sku).trim() : undefined,
            confidence: typeof p?.confidence === "number" ? p.confidence : undefined,
        }));

        return NextResponse.json({ ok: true, productos: normalized, source: "ia" });
    } catch (err) {
        console.error("Error al importar foto:", err);
        return NextResponse.json(
            { ok: false, error: "Error al procesar la imagen" },
            { status: 500 },
        );
    }
}
