import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/ia/extraer-productos
 * Extrae lista de productos de una imagen usando OpenAI Vision (opcional)
 * Fallback: devuelve error claro si OPENAI_API_KEY no está configurada
 */
export async function POST(request: Request) {
    try {
        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "IA no configurada",
                    message:
                        "Para usar extracción por IA, configura OPENAI_API_KEY en .env.local",
                    fallback: "Usa el formulario manual para cargar productos",
                },
                { status: 501 }
            );
        }

        const body = await request.json();
        const { imageBase64 } = body as { imageBase64: string };

        if (!imageBase64) {
            return NextResponse.json(
                { ok: false, error: "imageBase64 requerida" },
                { status: 400 }
            );
        }

        // Call OpenAI Vision API
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openaiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4-vision-preview",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `Analiza esta imagen de una lista de productos y extrae los siguientes datos en formato JSON:
                        [
                          {
                            "nombre": "nombre del producto",
                            "categoria": "categoría (ej: ASEO, BEBIDAS, etc)",
                            "precio_cop": número,
                            "stock": número
                          }
                        ]
                        
                        Si el stock no está claro, usa 0. Si el precio no está, usa 0. Devuelve SOLO el JSON array, sin explicación.`,
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${imageBase64}`,
                                },
                            },
                        ],
                    },
                ],
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const result = await response.json();
        const content = result.choices[0]?.message?.content || "[]";

        // Parse JSON
        let productos = [];
        try {
            productos = JSON.parse(content);
        } catch {
            productos = [];
        }

        return NextResponse.json({
            ok: true,
            productos,
            count: productos.length,
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { ok: false, error: "Error al extraer con IA: " + String(err) },
            { status: 500 }
        );
    }
}
