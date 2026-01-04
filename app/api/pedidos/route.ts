import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

type PedidoItem = {
    producto_id: string;
    nombre?: string;
    precio?: number | null;
    cantidad: number;
};

type Pedido = {
    pedido_id: string;
    created_at: string;
    bodega_id: string;
    items: PedidoItem[];
    total_items: number;
    total_valor: number;
    estado: "nuevo" | "enviado" | "entregado" | "cancelado";
};

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "pedidos.jsonl");

function safeNumber(v: any): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

async function ensureDataDir() {
    await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const bodega_id = String(body?.bodega_id ?? "").trim();
        const itemsRaw = Array.isArray(body?.items) ? body.items : [];

        const items: PedidoItem[] = itemsRaw
            .map((it: any) => ({
                producto_id: String(it?.producto_id ?? "").trim(),
                nombre: it?.nombre != null ? String(it.nombre) : undefined,
                precio: it?.precio != null ? safeNumber(it.precio) : null,
                cantidad: Math.max(0, Math.floor(safeNumber(it?.cantidad))),
            }))
            .filter((it) => Boolean(it.producto_id) && it.cantidad > 0);

        if (!bodega_id) {
            return NextResponse.json({ ok: false, error: "bodega_id es requerido" }, { status: 400 });
        }
        if (items.length === 0) {
            return NextResponse.json({ ok: false, error: "items vacío" }, { status: 400 });
        }

        const pedido_id =
            (globalThis.crypto as any)?.randomUUID?.() ??
            `PED_${Date.now()}_${Math.random().toString(16).slice(2)}`;

        const total_items = items.reduce((acc, it) => acc + it.cantidad, 0);
        const total_valor = items.reduce((acc, it) => acc + (safeNumber(it.precio) * it.cantidad), 0);

        const pedido: Pedido = {
            pedido_id,
            created_at: new Date().toISOString(),
            bodega_id,
            items,
            total_items,
            total_valor,
            estado: "nuevo",
        };

        await ensureDataDir();
        await fs.appendFile(FILE_PATH, JSON.stringify(pedido) + "\n", "utf8");

        return NextResponse.json({ ok: true, pedido });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: e?.message ?? "Error creando pedido" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        await ensureDataDir();
        let content = "";
        try {
            content = await fs.readFile(FILE_PATH, "utf8");
        } catch {
            content = "";
        }

        const pedidos = content
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean)
            .map((l) => {
                try {
                    return JSON.parse(l);
                } catch {
                    return null;
                }
            })
            .filter(Boolean);

        return NextResponse.json({ ok: true, total: pedidos.length, pedidos });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e?.message ?? "Error leyendo pedidos" }, { status: 500 });
    }
}
