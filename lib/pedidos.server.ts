export async function getPedidoById(id: string) {
    return prisma.pedido.findUnique({
        where: { id },
    });
}
import { PrismaClient, Pedido } from '@prisma/client';

const prisma = new PrismaClient();



// Obtener todos los pedidos
export async function getPedidos(): Promise<Pedido[]> {
    return prisma.pedido.findMany({
        orderBy: { createdAt: 'desc' },
    });
}

// Crear un nuevo pedido
export async function createPedido(data: {
    bodegaId: string;
    nombre: string;
    total: number;
    items: { productoId: string; cantidad: number }[];
    direccion: string;
    telefono: string;
}): Promise<Pedido> {
    return prisma.pedido.create({
        data: {
            bodegaId: data.bodegaId,
            direccion: data.direccion,
            telefono: data.telefono,
            nombre: data.nombre ?? "",
            total: data.total ?? 0,
            items: {
                create: data.items.map((item) => ({
                    productoId: item.productoId,
                    cantidad: item.cantidad,
                })),
            },
        },
        // No include block needed
    });
}

// Actualizar estado del pedido
export async function updatePedidoEstado(id: string, estado: string): Promise<Pedido | null> {
    return prisma.pedido.update({
        where: { id },
        data: { estado },
    });
}

// Asignar repartidor a pedido
export async function asignarRepartidor(pedidoId: string, repartidorId: string): Promise<Pedido | null> {
    return prisma.pedido.update({
        where: { id: pedidoId },
        data: {},
    });
}
