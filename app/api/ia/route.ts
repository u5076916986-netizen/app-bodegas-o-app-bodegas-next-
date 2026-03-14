import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

interface RequestBody {
    bodegaId?: string;
    message?: string;
}

interface Plan {
    type: "create" | "update" | "delete";
    target: "producto" | "promo" | "pedido";
    payload: Record<string, unknown>;
}

interface IaResponse {
    summary: string;
    plan: Plan[];
    requiresApproval: boolean;
}

type ProductoData = {
    id: string;
    bodegaId: string;
    nombre: string;
    sku?: string;
    categoria?: string;
    precio?: number;
    stock?: number;
    activo?: boolean;
};

type PromoData = {
    id: string;
    bodegaId: string;
    nombre: string;
    estado?: string;
    fechaInicio?: string;
    fechaFin?: string;
    valor?: number;
    tipo?: string;
};

const readJson = async <T,>(fileName: string): Promise<T[]> => {
    try {
        const filePath = path.join(process.cwd(), "data", fileName);
        const raw = await fs.readFile(filePath, "utf-8");
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
        return [];
    }
};

const buildSafeResponse = async (message: string, bodegaId: string): Promise<IaResponse> => {
    const lowerMsg = message.toLowerCase();
    const productos = (await readJson<ProductoData>("productos.json")).filter(
        (item) => item.bodegaId === bodegaId,
    );
    const promos = (await readJson<PromoData>("promociones.json")).filter(
        (item) => item.bodegaId === bodegaId,
    );

    const activeProductos = productos.filter((item) => item.activo !== false);
    const lowStock = [...activeProductos]
        .filter((item) => Number.isFinite(item.stock ?? 0) && Number(item.stock ?? 0) <= 5)
        .sort((a, b) => Number(a.stock ?? 0) - Number(b.stock ?? 0))
        .slice(0, 5);
    const inactiveProductos = productos.filter((item) => item.activo === false).slice(0, 5);
    const activePromos = promos.filter((promo) => promo.estado === "activa" || promo.estado === "programada");

    const summaryParts: string[] = [];
    summaryParts.push(`Analisis basado en datos reales de la bodega ${bodegaId}.`);

    if (lowerMsg.includes("stock") || lowerMsg.includes("inventario") || lowerMsg.includes("reponer")) {
        if (lowStock.length > 0) {
            const list = lowStock.map((item) => `${item.nombre} (stock ${item.stock ?? 0})`).join(", ");
            summaryParts.push(`Productos con stock bajo: ${list}.`);
            summaryParts.push("Indica cantidades exactas si deseas actualizar stock.");
        } else {
            summaryParts.push("No hay productos con stock bajo registrados.");
        }
    }

    if (lowerMsg.includes("promocion") || lowerMsg.includes("promo")) {
        if (activePromos.length > 0) {
            const list = activePromos.map((promo) => `${promo.nombre} (${promo.estado})`).join(", ");
            summaryParts.push(`Promos activas/programadas: ${list}.`);
        } else {
            summaryParts.push("No hay promociones activas o programadas registradas.");
        }
    }

    if (lowerMsg.includes("eliminar") || lowerMsg.includes("inactivo")) {
        if (inactiveProductos.length > 0) {
            const list = inactiveProductos.map((item) => item.nombre).join(", ");
            summaryParts.push(`Productos inactivos: ${list}.`);
            summaryParts.push("Confirma los IDs si deseas eliminarlos.");
        } else {
            summaryParts.push("No hay productos inactivos para eliminar.");
        }
    }

    if (lowerMsg.includes("crear") || lowerMsg.includes("producto")) {
        summaryParts.push("Para crear productos, necesito que confirmes nombre, precio y categoria.");
    }

    if (summaryParts.length === 1) {
        summaryParts.push(`Productos registrados: ${productos.length}. Promos registradas: ${promos.length}.`);
        summaryParts.push("Dime que accion concreta deseas sobre productos existentes.");
    }

    return {
        summary: summaryParts.join(" "),
        plan: [],
        requiresApproval: false,
    };
};

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as RequestBody;
        const { bodegaId, message } = body;

        if (!bodegaId || !message) {
            return NextResponse.json(
                { ok: false, error: "bodegaId y message son requeridos" },
                { status: 400 },
            );
        }

        if (typeof message !== "string" || message.trim().length === 0) {
            return NextResponse.json(
                { ok: false, error: "El mensaje debe ser una cadena no vacía" },
                { status: 400 },
            );
        }

        // Cargar contexto de la bodega
        const productos = (await readJson<ProductoData>("productos.json")).filter(
            (item) => item.bodegaId === bodegaId,
        );
        const promos = (await readJson<PromoData>("promociones.json")).filter(
            (item) => item.bodegaId === bodegaId,
        );

        const activeProductos = productos.filter((item) => item.activo !== false);
        const lowStock = activeProductos
            .filter((item) => Number(item.stock ?? 0) <= 5)
            .slice(0, 10)
            .map((p) => `${p.nombre} (stock: ${p.stock ?? 0}, precio: $${p.precio ?? 0})`);

        const categorias = Array.from(new Set(productos.map((p) => p.categoria).filter(Boolean)));

        const contexto = `
Datos de la bodega ${bodegaId}:
- Productos activos: ${activeProductos.length}
- Stock bajo (≤5): ${lowStock.join(", ") || "ninguno"}
- Promociones activas: ${promos.filter((p) => p.estado === "activa").length}
- Categorías: ${categorias.join(", ") || "sin datos"}
        `.trim();

        // Usar Claude si hay API key, fallback si no
        const anthropicKey = process.env.ANTHROPIC_API_KEY;
        if (!anthropicKey) {
            const fallback = await buildSafeResponse(message, bodegaId);
            return NextResponse.json({
                ok: true,
                data: fallback,
                _note: "Configura ANTHROPIC_API_KEY para respuestas con IA real.",
            });
        }

        const client = new Anthropic({ apiKey: anthropicKey });

        const claudeResponse = await client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 1024,
            system: `Eres el asistente IA de una bodega colombiana. Ayudas al bodeguero con inventario, promociones, análisis de ventas y decisiones del negocio.
Hablas en español colombiano informal pero profesional. Responde de forma concisa y útil.
Si detectas problemas (stock bajo, sin promos activas), sugiere acciones concretas y específicas.

${contexto}`,
            messages: [{ role: "user", content: message }],
        });

        const claudeText =
            claudeResponse.content[0]?.type === "text"
                ? claudeResponse.content[0].text
                : "No pude procesar tu solicitud.";

        const requiresApproval =
            claudeText.toLowerCase().includes("crear") ||
            claudeText.toLowerCase().includes("actualizar") ||
            claudeText.toLowerCase().includes("eliminar");

        return NextResponse.json({
            ok: true,
            data: {
                summary: claudeText,
                plan: [],
                requiresApproval,
            },
            model: "claude-sonnet-4-6",
        });
    } catch (error) {
        console.error("Error en /api/ia:", error);
        return NextResponse.json(
            { ok: false, error: "Error procesando la solicitud" },
            { status: 500 },
        );
    }
}
