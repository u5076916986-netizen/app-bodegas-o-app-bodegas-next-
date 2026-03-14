import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

/**
 * POST /api/ia/extraer-productos
 * Extrae lista de productos de una imagen usando Claude Vision (Anthropic)
 * Fallback: devuelve error claro si ANTHROPIC_API_KEY no está configurada
 */
export async function POST(request: Request) {
    try {
        const anthropicKey = process.env.ANTHROPIC_API_KEY;
        if (!anthropicKey) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "IA no configurada",
                    message:
                        "Para usar extracción por IA, configura ANTHROPIC_API_KEY en .env.local",
                    fallback: "Usa el formulario manual para cargar productos",
                },
                { status: 501 }
            );
        }

        const body = await request.json();
        const { imageBase64, mediaType = "image/jpeg" } = body as {
            imageBase64: string;
            mediaType?: string;
        };

        if (!imageBase64) {
            return NextResponse.json(
                { ok: false, error: "imageBase64 requerida" },
                { status: 400 }
            );
        }

        const client = new Anthropic({ apiKey: anthropicKey });

        const response = await client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 2048,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: mediaType as
                                    | "image/jpeg"
                                    | "image/png"
                                    | "image/gif"
                                    | "image/webp",
                                data: imageBase64,
                            },
                        },
                        {
                            type: "text",
                            text: `Eres un asistente especializado en bodegas colombianas.
Analiza esta imagen (puede ser una lista de precios, foto de estantería, lista escrita, etc.) y extrae TODOS los productos visibles.

Devuelve ÚNICAMENTE un JSON array con este formato exacto (sin explicación, sin markdown, solo el JSON):
[
  {
    "nombre": "nombre del producto",
    "categoria": "una de: ASEO, BEBIDAS, GRANOS, LACTEOS, PANADERIA, CARNES, FRUTAS_VERDURAS, SNACKS, LICORES, CIGARRILLOS, OTROS",
    "precio_cop": número entero (precio en pesos colombianos, 0 si no se ve),
    "stock": número entero (cantidad disponible, 10 si no se ve),
    "descripcion": "descripción breve o null"
  }
]

Si no puedes identificar ningún producto, devuelve [].`,
                        },
                    ],
                },
            ],
        });

        const content =
            response.content[0]?.type === "text" ? response.content[0].text : "[]";

        // Limpiar posibles bloques ```json ... ```
        let productos = [];
        try {
            const cleaned = content
                .replace(/```json\n?/g, "")
                .replace(/```\n?/g, "")
                .trim();
            productos = JSON.parse(cleaned);
        } catch {
            productos = [];
        }

        return NextResponse.json({
            ok: true,
            productos,
            count: productos.length,
            model: "claude-sonnet-4-6",
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { ok: false, error: "Error al extraer con IA: " + String(err) },
            { status: 500 }
        );
    }
}
