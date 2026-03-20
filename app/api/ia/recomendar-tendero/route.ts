import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

/**
 * POST /api/ia/recomendar-tendero
 * Claude analiza el historial de compras del tendero y recomienda productos.
 *
 * Body: {
 *   telefono: string,       // identificador del tendero
 *   bodegaId?: string,      // filtrar por bodega (opcional)
 *   limite?: number         // max recomendaciones (default 5)
 * }
 *
 * Returns: {
 *   ok: boolean,
 *   recomendaciones: Array<{
 *     productoId, nombre, precio, categoria, bodegaId,
 *     razon, urgencia (1-10), promoActiva?
 *   }>
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            telefono,
            bodegaId,
            limite = 5,
        } = body as { telefono?: string; bodegaId?: string; limite?: number };

        // ── 1. Cargar historial de pedidos ────────────────────────────────────
        const whereClause: Record<string, unknown> = {};
        if (telefono) whereClause.telefono = telefono;
        if (bodegaId) whereClause.bodegaId = bodegaId;

        const pedidosHistorial = await prisma.pedido.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        // Extraer items comprados del historial
        type ItemComprado = { nombre: string; cantidad: number; categoria?: string };
        const itemsComprados: ItemComprado[] = pedidosHistorial.flatMap((p) => {
            const items = Array.isArray(p.items) ? p.items as ItemComprado[] : [];
            return items.map((item) => ({
                nombre: item.nombre || "",
                cantidad: item.cantidad || 1,
                categoria: item.categoria || "",
            }));
        });

        // Contar frecuencia de productos comprados
        const frecuencia: Record<string, number> = {};
        const categoriasFrecuentes = new Set<string>();
        itemsComprados.forEach((item) => {
            if (item.nombre) frecuencia[item.nombre] = (frecuencia[item.nombre] || 0) + item.cantidad;
            if (item.categoria) categoriasFrecuentes.add(item.categoria);
        });

        // ── 2. Cargar catálogo disponible ─────────────────────────────────────
        const productosDisponibles = await prisma.producto.findMany({
            where: {
                activo: true,
                stock: { gt: 0 },
                ...(bodegaId ? { bodegaId } : {}),
            },
            orderBy: { nombre: "asc" },
            take: 100,
        });

        // ── 3. Sin historial → productos más populares (por stock) ─────────────
        if (itemsComprados.length === 0) {
            const top = productosDisponibles.slice(0, limite);
            return NextResponse.json({
                ok: true,
                recomendaciones: top.map((p) => ({
                    productoId: p.id,
                    nombre: p.nombre,
                    precio: p.precio,
                    categoria: p.categoria,
                    bodegaId: p.bodegaId,
                    razon: "Producto popular con buena disponibilidad",
                    urgencia: 5,
                })),
                fuente: "catalogo_popular",
            });
        }

        // ── 4. Intentar con Claude si hay API key ─────────────────────────────
        const anthropicKey = process.env.ANTHROPIC_API_KEY;
        if (!anthropicKey) {
            // Fallback: recomendar productos de categorías frecuentes no compradas recientemente
            const nombresRecientes = new Set(Object.keys(frecuencia));
            const recomendaciones = productosDisponibles
                .filter((p) => !nombresRecientes.has(p.nombre))
                .filter((p) => categoriasFrecuentes.has(p.categoria) || categoriasFrecuentes.size === 0)
                .slice(0, limite)
                .map((p) => ({
                    productoId: p.id,
                    nombre: p.nombre,
                    precio: p.precio,
                    categoria: p.categoria,
                    bodegaId: p.bodegaId,
                    razon: `Complementa tus compras frecuentes de ${p.categoria}`,
                    urgencia: 6,
                }));

            return NextResponse.json({
                ok: true,
                recomendaciones,
                fuente: "reglas",
                _note: "Configura ANTHROPIC_API_KEY para recomendaciones inteligentes",
            });
        }

        // ── 5. Claude genera recomendaciones personalizadas ───────────────────
        const client = new Anthropic({ apiKey: anthropicKey });

        const historialResumen = Object.entries(frecuencia)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .map(([nombre, cant]) => `${nombre} (×${cant})`)
            .join(", ");

        const catalogoResumen = productosDisponibles
            .slice(0, 60)
            .map((p) => `ID:${p.id} | ${p.nombre} | $${p.precio} | ${p.categoria} | stock:${p.stock}`)
            .join("\n");

        const prompt = `Eres un sistema de recomendación de productos para una bodega colombiana.

HISTORIAL DE COMPRAS DEL TENDERO (últimas compras):
${historialResumen}

CATÁLOGO DISPONIBLE (solo recomienda de esta lista):
${catalogoResumen}

Recomienda exactamente ${limite} productos que el tendero debería comprar, priorizando:
1. Productos complementarios a lo que ya compra frecuentemente
2. Productos de reposición (si compra mucho de algo, sugiere más)
3. Productos que no ha comprado pero son afines a sus categorías

Responde SOLO con un JSON array (sin markdown, sin explicación):
[
  {
    "productoId": "ID exacto del catálogo",
    "nombre": "nombre del producto",
    "razon": "por qué le conviene (máx 15 palabras)",
    "urgencia": número del 1 al 10
  }
]`;

        const claudeResponse = await client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 1024,
            messages: [{ role: "user", content: prompt }],
        });

        const content =
            claudeResponse.content[0]?.type === "text" ? claudeResponse.content[0].text : "[]";

        let sugerenciasClaude: Array<{ productoId: string; nombre: string; razon: string; urgencia: number }> = [];
        try {
            const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            sugerenciasClaude = JSON.parse(cleaned);
        } catch {
            sugerenciasClaude = [];
        }

        // Enriquecer con datos reales del catálogo
        const recomendaciones = sugerenciasClaude
            .map((s) => {
                const producto = productosDisponibles.find((p) => p.id === s.productoId);
                if (!producto) return null;
                return {
                    productoId: producto.id,
                    nombre: producto.nombre,
                    precio: producto.precio,
                    categoria: producto.categoria,
                    bodegaId: producto.bodegaId,
                    razon: s.razon,
                    urgencia: Math.min(10, Math.max(1, s.urgencia)),
                };
            })
            .filter(Boolean);

        return NextResponse.json({
            ok: true,
            recomendaciones,
            fuente: "claude",
            model: "claude-sonnet-4-6",
        });
    } catch (error) {
        console.error("Error en /api/ia/recomendar-tendero:", error);
        return NextResponse.json(
            { ok: false, error: "Error generando recomendaciones" },
            { status: 500 },
        );
    }
}
