import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

/**
 * POST /api/ia/sugerir-promos
 * Claude analiza el inventario y sugiere promociones y cupones concretos.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { bodegaId, tipo = "promocion" } = body as {
            bodegaId: string;
            tipo?: "promocion" | "cupon";
        };

        if (!bodegaId) {
            return NextResponse.json(
                { ok: false, error: "bodegaId requerido" },
                { status: 400 },
            );
        }

        // Leer productos de la bodega
        let productos: Array<{ bodegaId: string; nombre: string; categoria?: string; precio?: number; stock?: number; activo?: boolean }> = [];
        try {
            const filePath = path.join(process.cwd(), "data", "productos.json");
            const raw = await fs.readFile(filePath, "utf-8");
            const all = JSON.parse(raw);
            productos = Array.isArray(all)
                ? all.filter((p) => p.bodegaId === bodegaId && p.activo !== false)
                : [];
        } catch {
            productos = [];
        }

        const categorias = Array.from(new Set(productos.map((p) => p.categoria).filter(Boolean)));
        const stockBajo = productos
            .filter((p) => Number(p.stock ?? 0) <= 10)
            .slice(0, 8)
            .map((p) => `${p.nombre} (stock: ${p.stock}, precio: $${p.precio})`);
        const masCaros = [...productos]
            .sort((a, b) => (b.precio ?? 0) - (a.precio ?? 0))
            .slice(0, 5)
            .map((p) => `${p.nombre} ($${p.precio})`);

        const contexto = `
Bodega: ${bodegaId}
Total productos: ${productos.length}
Categorías: ${categorias.join(", ") || "sin datos"}
Productos con stock bajo (≤10): ${stockBajo.join(", ") || "ninguno"}
Productos más caros: ${masCaros.join(", ") || "sin datos"}
        `.trim();

        const anthropicKey = process.env.ANTHROPIC_API_KEY;
        if (!anthropicKey) {
            // Sugerencias predeterminadas sin IA
            const sugerencias =
                tipo === "cupon"
                    ? [
                          { codigo: "BIENVENIDO10", descuento: 10, tipo: "porcentaje", descripcion: "10% para nuevos clientes" },
                          { codigo: "FIEL15", descuento: 15, tipo: "porcentaje", descripcion: "15% para clientes frecuentes" },
                          { codigo: "ENV5K", descuento: 5000, tipo: "monto_fijo", descripcion: "$5.000 en compras mayores a $50.000" },
                      ]
                    : [
                          { nombre: "Descuento Granos 20%", tipo: "porcentaje", valor: 20, aplicaA: "categoria", categorias: ["GRANOS"] },
                          { nombre: "2x1 en Bebidas", tipo: "porcentaje", valor: 50, aplicaA: "categoria", categorias: ["BEBIDAS"] },
                          { nombre: "Liquidación Stock Bajo", tipo: "porcentaje", valor: 30, aplicaA: "todos", categorias: [] },
                      ];
            return NextResponse.json({
                ok: true,
                sugerencias,
                _note: "Sugerencias genéricas. Configura ANTHROPIC_API_KEY para personalizadas.",
            });
        }

        const client = new Anthropic({ apiKey: anthropicKey });

        const prompt =
            tipo === "cupon"
                ? `Basándote en estos datos de inventario, sugiere exactamente 3 cupones de descuento creativos y efectivos para una bodega colombiana.
Devuelve SOLO un JSON array sin explicación:
[
  {
    "codigo": "CODIGO_MAYUSCULAS",
    "descuento": número,
    "tipo": "porcentaje" o "monto_fijo",
    "descripcion": "descripción del cupón para mostrar al cliente",
    "condicion": "condición de uso (ej: compras mayores a $30.000)"
  }
]`
                : `Basándote en estos datos de inventario, sugiere exactamente 3 promociones concretas y rentables para la bodega.
Devuelve SOLO un JSON array sin explicación:
[
  {
    "nombre": "nombre de la promoción",
    "tipo": "porcentaje" o "monto_fijo",
    "valor": número,
    "aplicaA": "categoria" o "todos",
    "categorias": ["CATEGORIA1"] o [],
    "duracion_dias": número,
    "justificacion": "por qué esta promo ayudaría al negocio"
  }
]`;

        const claudeResponse = await client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 1024,
            system: `Eres un experto en estrategias de ventas para bodegas y tiendas de barrio colombianas.
Conoces precios, comportamiento de consumidores y tendencias del mercado popular colombiano.
${contexto}`,
            messages: [{ role: "user", content: prompt }],
        });

        const content =
            claudeResponse.content[0]?.type === "text" ? claudeResponse.content[0].text : "[]";

        let sugerencias = [];
        try {
            const cleaned = content
                .replace(/```json\n?/g, "")
                .replace(/```\n?/g, "")
                .trim();
            sugerencias = JSON.parse(cleaned);
        } catch {
            sugerencias = [];
        }

        return NextResponse.json({
            ok: true,
            sugerencias,
            tipo,
            model: "claude-sonnet-4-6",
        });
    } catch (error) {
        console.error("Error en /api/ia/sugerir-promos:", error);
        return NextResponse.json(
            { ok: false, error: "Error procesando la solicitud" },
            { status: 500 },
        );
    }
}
