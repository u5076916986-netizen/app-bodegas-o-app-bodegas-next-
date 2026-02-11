// Server-only file for pedido persistence
import fs from "fs/promises";
import path from "path";
import type { Pedido } from "./pedidos.types";

const FILE_PATH = path.join(process.cwd(), "data", "pedidos.json");

export function getStorageMode() {
    return "archivo";
}

export async function readPedidos(): Promise<Pedido[]> {
    try {
        const data = await fs.readFile(FILE_PATH, "utf-8");
        return JSON.parse(data) as Pedido[];
    } catch (error: any) {
        if (error.code === "ENOENT") {
            return [];
        }
        throw error;
    }
}

export async function appendPedido(pedido: Pedido): Promise<Pedido> {
    const pedidos = await readPedidos();
    pedidos.push(pedido);

    // Asegurar que el directorio exista
    try {
        await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
    } catch { }

    await fs.writeFile(FILE_PATH, JSON.stringify(pedidos, null, 2), "utf-8");
    return pedido;
}

export async function getPedidoByTracking(
    trackingCode: string | undefined | null
): Promise<Pedido | null> {
    if (!trackingCode || typeof trackingCode !== "string") return null;
    const normalized = trackingCode.trim().toUpperCase();
    if (!normalized) return null;

    const pedidos = await readPedidos();
    return (
        pedidos.find((p) => {
            const target = (p.trackingCode ?? p.pedidoId ?? "").toUpperCase();
            return target === normalized;
        }) || null
    );
}

export async function getPedidoById(id: string): Promise<Pedido | null> {
    const pedidos = await readPedidos();
    return pedidos.find((p) => p.pedidoId === id) || null;
}

export async function updatePedido(
    id: string,
    updates: Partial<Pedido>
): Promise<Pedido | null> {
    const pedidos = await readPedidos();
    const index = pedidos.findIndex((p) => p.pedidoId === id);
    if (index === -1) return null;

    pedidos[index] = { ...pedidos[index], ...updates };

    // Asegurar que el directorio exista
    try {
        await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
    } catch { }

    await fs.writeFile(FILE_PATH, JSON.stringify(pedidos, null, 2), "utf-8");
    return pedidos[index];
}
