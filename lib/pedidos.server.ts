
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

id: string;
pedidoId ?: string;
nombre: string;
telefono: string;
direccion: string;
items: any;
total: number;
estado: string;
bodegaId ?: string;
createdAt ?: Date;
};

export async function getPedidoById(id: string): Promise<Pedido | null> {
    try {
        return await prisma.pedido.findUnique({ where: { id } });
    } catch (error) {
        console.error("Error buscando pedido:", error);
        return null;
    }
}

export async function updatePedido(id: string, updates: Partial<Pedido>): Promise<Pedido | null> {
    try {
        return await prisma.pedido.update({ where: { id }, data: updates });
    } catch (error) {
        console.error("Error actualizando pedido:", error);
        return null;
    }
}

export async function getPedidoByTracking(trackingCode: string | undefined | null): Promise<Pedido | null> {
    if (!trackingCode) return null;
    try {
        return await prisma.pedido.findFirst({
            where: { id: trackingCode.trim() }
        });
    } catch (error) {
        console.error("Error buscando por tracking:", error);
        return null;
    }
}
