"use client";

import type { Pedido } from "@/lib/pedidos";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function RepartidorDetalleClient({ pedido: initialPedido }: { pedido: Pedido }) {
    const [pedido, setPedido] = useState<Pedido>(initialPedido);
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const formatCurrency = useMemo(
        () => (value: number) =>
            new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
            }).format(value),
        [],
    );

    const formatDate = useMemo(
        () => (value?: string) => {
            if (!value || !mounted) return "—";
            return new Date(value).toLocaleString("es-CO");
        },
        [mounted],
    );

    const handleEstadoChange = async (nuevoEstado: string) => {
        setActionInProgress(nuevoEstado);
        setError(null);
        try {
            const res = await fetch(`/api/pedidos/${pedido.pedidoId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ estado: nuevoEstado }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Error HTTP ${res.status}`);
            }

            const data = await res.json() as { ok: boolean; pedido?: Pedido };
            if (data.ok && data.pedido) {
                setPedido(data.pedido);
            } else {
                throw new Error("No se pudo actualizar el pedido");
            }
        } catch (err: any) {
            setError(err.message || "Error al actualizar estado");
        } finally {
            setActionInProgress(null);
        }
    };

    const getEstadoLabel = (estado: string) => {
        switch (estado) {
            case "confirmado":
                return "Confirmado";
            case "asignado":
                return "Asignado";
            case "en_bodega":
                return "En bodega";
            case "recogido":
                return "Recogido";
            case "en_ruta":
                return "En ruta";
            case "entregado":
                return "Entregado";
            case "cancelado":
                return "Cancelado";
            default:
                return estado.replace("_", " ");
        }
    };

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case "confirmado":
                return "bg-blue-100 text-blue-800";
            case "asignado":
                return "bg-indigo-100 text-indigo-800";
            case "en_bodega":
                return "bg-amber-100 text-amber-800";
            case "recogido":
                return "bg-amber-100 text-amber-800";
            case "en_ruta":
                return "bg-orange-100 text-orange-800";
            case "entregado":
                return "bg-emerald-100 text-emerald-800";
            case "cancelado":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div>
            {/* Resumen del pedido */}
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-sm text-gray-600">ID Pedido</div>
                        <div className="font-mono text-sm">{pedido.pedidoId}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-600">Estado</div>
                        <span className={`px-3 py-1 rounded text-xs font-semibold ${getEstadoColor(pedido.estado)}`}>
                            {getEstadoLabel(pedido.estado)}
                        </span>
                    </div>
                    <div>
                        <div className="text-sm text-gray-600">Total</div>
                        <div className="text-lg font-semibold text-green-700">
                            {formatCurrency(pedido.total ?? 0)}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-600">Repartidor Asignado</div>
                        <div className="text-sm">{pedido.repartidorNombre || "Sin asignar"}</div>
                    </div>
                </div>
            </div>

            {/* Datos de entrega */}
            <div className="mb-6 p-4 border rounded-lg">
                <h2 className="text-lg font-semibold mb-3">Datos de Entrega</h2>
                <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                        <span className="font-medium text-gray-700">Nombre:</span> {pedido.datosEntrega?.nombre || "—"}
                    </div>
                    <div>
                        <span className="font-medium text-gray-700">Teléfono:</span> {pedido.datosEntrega?.telefono || "—"}
                    </div>
                    <div>
                        <span className="font-medium text-gray-700">Dirección:</span>{" "}
                        {pedido.datosEntrega?.direccion || "—"}
                    </div>
                    <div>
                        <span className="font-medium text-gray-700">Notas:</span> {pedido.datosEntrega?.notas || "—"}
                    </div>
                </div>
            </div>

            {/* Items del pedido */}
            <div className="mb-6 p-4 border rounded-lg">
                <h2 className="text-lg font-semibold mb-3">Productos ({pedido.items?.length || 0})</h2>
                <div className="space-y-2">
                    {pedido.items && pedido.items.length > 0 ? (
                        pedido.items.map((item) => (
                            <div
                                key={`${pedido.pedidoId}-${item.productoId || item.sku || item.nombre || "item"}-${item.cantidad ?? ""}`}
                                className="flex justify-between text-sm border-b pb-2"
                            >
                                <div>
                                    <div className="font-medium">{item.nombre || "Producto sin nombre"}</div>
                                    <div className="text-xs text-gray-600">ID: {item.productoId}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-medium">
                                        {item.cantidad} x {formatCurrency(item.precio_cop ?? 0)}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        Subtotal: {formatCurrency(item.subtotal ?? 0)}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-sm text-gray-500">No hay items en este pedido.</div>
                    )}
                </div>
            </div>

            {/* Resumen de totales */}
            <div className="mb-6 p-4 border rounded-lg bg-green-50">
                <h2 className="text-lg font-semibold mb-3">Monto a Cobrar</h2>
                <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-green-700">{formatCurrency(pedido.total ?? 0)}</span>
                </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-col gap-3 mb-6">
                {error && (
                    <div className="p-3 bg-red-100 text-red-800 rounded text-sm">
                        Error: {error}
                    </div>
                )}
                <div className="flex gap-3 flex-wrap">
                    {pedido.estado === "asignado" ? (
                        <button
                            onClick={() => handleEstadoChange("en_bodega")}
                            disabled={actionInProgress !== null}
                            className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {actionInProgress === "en_bodega" ? "Actualizando..." : "Llegué a bodega"}
                        </button>
                    ) : null}

                    {pedido.estado === "en_bodega" ? (
                        <button
                            onClick={() => handleEstadoChange("recogido")}
                            disabled={actionInProgress !== null}
                            className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {actionInProgress === "recogido" ? "Actualizando..." : "Recogido"}
                        </button>
                    ) : null}

                    {pedido.estado === "recogido" ? (
                        <button
                            onClick={() => handleEstadoChange("en_ruta")}
                            disabled={actionInProgress !== null}
                            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {actionInProgress === "en_ruta" ? "Actualizando..." : "Iniciar ruta"}
                        </button>
                    ) : null}

                    {pedido.estado === "en_ruta" ? (
                        <button
                            onClick={() => handleEstadoChange("entregado")}
                            disabled={actionInProgress !== null}
                            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {actionInProgress === "entregado" ? "Marcando..." : "Marcar entregado"}
                        </button>
                    ) : null}

                    <Link
                        href="/repartidor"
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                        Volver a lista
                    </Link>
                </div>
            </div>

            {/* Info de auditoría */}
            <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                <div>Creado: {formatDate(pedido.createdAt)}</div>
                {pedido.updatedAt ? <div>Actualizado: {formatDate(pedido.updatedAt)}</div> : null}
            </div>
        </div>
    );
}
