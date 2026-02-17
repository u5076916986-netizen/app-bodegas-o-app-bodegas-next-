// Server-only file for pedido persistence

import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

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


export async function getPedidoById(id: string) {
    try {
        const pedido = await prisma.pedido.findUnique({
            where: { id },
        });
        return pedido;
    } catch (error) {
        console.error("Error buscando pedido:", error);
        return null;
    }
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
