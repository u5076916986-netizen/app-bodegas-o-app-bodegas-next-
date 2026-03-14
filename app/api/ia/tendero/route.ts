import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

/**
 * POST /api/ia/tendero
 * Asistente Claude para el tendero (comprador).
 * Ayuda a encontrar productos, recomienda compras, explica promociones.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, contexto } = body as {
            message: string;
            contexto?: {
                bodegaActual?: string;
                productosEnCarrito?: string[];
                historialCompras?: string[];
                busquedaActual?: string;
            };
        };

        if (!message || typeof message !== "string" || message.trim().length === 0) {
            return NextResponse.json(
                { ok: false, error: "message es requerido" },
                { status: 400 },
            );
        }

        const anthropicKey = process.env.ANTHROPIC_API_KEY;
        if (!anthropicKey) {
            // Respuesta básica sin API key
            return NextResponse.json({
                ok: true,
                respuesta:
                    "Hola! Soy tu asistente de compras. Para activar respuestas inteligentes, configura ANTHROPIC_API_KEY. Por ahora puedo decirte que puedes buscar productos por categoría, añadir al carrito y seguir tu pedido desde 'Mis pedidos'.",
                _note: "Configura ANTHROPIC_API_KEY para respuestas con IA real.",
            });
        }

        const client = new Anthropic({ apiKey: anthropicKey });

        // Construir contexto para Claude
        let contextoStr = "";
        if (contexto) {
            if (contexto.bodegaActual) contextoStr += `\nBodega actual: ${contexto.bodegaActual}`;
            if (contexto.productosEnCarrito?.length)
                contextoStr += `\nProductos en carrito: ${contexto.productosEnCarrito.join(", ")}`;
            if (contexto.historialCompras?.length)
                contextoStr += `\nÚltimas compras: ${contexto.historialCompras.join(", ")}`;
            if (contexto.busquedaActual)
                contextoStr += `\nEstá buscando: ${contexto.busquedaActual}`;
        }

        const claudeResponse = await client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 512,
            system: `Eres el asistente de compras de una app tipo Rappi para bodegas colombianas.
Ayudas a los tenderos (compradores) a:
- Encontrar productos y bodegas
- Entender promociones y descuentos
- Gestionar su carrito y pedidos
- Hacer seguimiento de entregas

Hablas en español colombiano amigable e informal. Respuestas cortas y útiles (máximo 3 párrafos).
No inventes precios ni productos específicos. Si no sabes algo, sugiere buscar en la app.
${contextoStr ? `\nContexto del usuario:${contextoStr}` : ""}`,
            messages: [{ role: "user", content: message }],
        });

        const respuesta =
            claudeResponse.content[0]?.type === "text"
                ? claudeResponse.content[0].text
                : "No pude entenderte. ¿Puedes reformular tu pregunta?";

        return NextResponse.json({
            ok: true,
            respuesta,
            model: "claude-sonnet-4-6",
        });
    } catch (error) {
        console.error("Error en /api/ia/tendero:", error);
        return NextResponse.json(
            { ok: false, error: "Error procesando la solicitud" },
            { status: 500 },
        );
    }
}
