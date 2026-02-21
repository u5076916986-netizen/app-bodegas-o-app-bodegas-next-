export enum EstadoPedido {
    NUEVO = "nuevo",
    ACEPTADO = "aceptado",
    PREPARANDO = "preparando",
    LISTO = "listo",
    EN_CAMINO = "en_camino",
    ENTREGADO = "entregado",
    CANCELADO = "cancelado",
}

export type Pedido = {
    id?: string;
    pedidoId: string;
    trackingCode?: string;
    bodegaId?: string;
    total: number;
    totalOriginal?: number;
    discount?: number;
    coupon?: { code: string; descuentoCOP: number };
    pointsEarned?: number;
    estado: string;
    createdAt?: Date;
    updatedAt?: Date;
    items: Array<any>;
    datosEntrega?: { direccion?: string;[key: string]: any } | null;
    cliente?: {
        nombre?: string;
        telefono?: string;
    } | null;
    direccion?: string;
    metodoPago?: string;
    zona?: string;
    asignadoA?: string | null;
    // Campos para repartidor
    repartidorNombre?: string | null;
    repartidorId?: string;
    repartidorTelefono?: string | null;
    takenAt?: Date;
    deliveredAt?: Date;
};

/**
 * Validar transiciones de estado permitidas en la máquina de estados de pedidos
 * nuevo → aceptado → preparando → listo → en_camino → entregado
 * Cualquier estado puede ir a cancelado
 */
export function isValidStateTransition(
    fromEstado: string,
    toEstado: string
): boolean {
    // No se puede hacer transición de cancelado a otro estado
    if (fromEstado === EstadoPedido.CANCELADO) {
        return false;
    }

    // Cualquier estado puede ir a cancelado
    if (toEstado === EstadoPedido.CANCELADO) {
        return true;
    }

    // Transiciones válidas por flujo normal
    const validTransitions: Record<string, string[]> = {
        [EstadoPedido.NUEVO]: [EstadoPedido.ACEPTADO],
        [EstadoPedido.ACEPTADO]: [EstadoPedido.PREPARANDO],
        [EstadoPedido.PREPARANDO]: [EstadoPedido.LISTO],
        [EstadoPedido.LISTO]: [EstadoPedido.EN_CAMINO],
        [EstadoPedido.EN_CAMINO]: [EstadoPedido.ENTREGADO],
        [EstadoPedido.ENTREGADO]: [], // Terminal
    };

    return (validTransitions[fromEstado] || []).includes(toEstado);
}
