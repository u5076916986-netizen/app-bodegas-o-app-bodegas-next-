"use client";

import type { Pedido } from "@/lib/pedidos";
import { EstadoPedido } from "@/lib/pedidos";
import Link from "next/link";
import { useState } from "react";

export default function PedidoDetalleClient({ initialPedido }: { initialPedido: Pedido }) {
    const [pedido, setPedido] = useState<Pedido>(initialPedido);
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

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
                        <div className="text-sm text-gray-600">Fecha de creación</div>
                        <div className="text-sm">
                            {new Date(pedido.createdAt).toLocaleDateString("es-CO", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-600">Estado</div>
                        <span
                            className={`px-3 py-1 rounded text-xs font-semibold ${pedido.estado === EstadoPedido.NUEVO
                                    ? "bg-yellow-100 text-yellow-800"
                                    : pedido.estado === EstadoPedido.ACEPTADO
                                        ? "bg-blue-100 text-blue-800"
                                        : pedido.estado === EstadoPedido.PREPARANDO
                                            ? "bg-purple-100 text-purple-800"
                                            : pedido.estado === EstadoPedido.LISTO
                                                ? "bg-green-100 text-green-800"
                                                : pedido.estado === EstadoPedido.EN_CAMINO
                                                    ? "bg-indigo-100 text-indigo-800"
                                                    : pedido.estado === EstadoPedido.ENTREGADO
                                                        ? "bg-gray-100 text-gray-800"
                                                        : pedido.estado === EstadoPedido.CANCELADO
                                                            ? "bg-red-100 text-red-800"
                                                            : "bg-gray-100 text-gray-800"
                                }`}
                        >
                            {pedido.estado === EstadoPedido.NUEVO ? "Nuevo"
                                : pedido.estado === EstadoPedido.ACEPTADO ? "Aceptado"
                                    : pedido.estado === EstadoPedido.PREPARANDO ? "Preparando"
                                        : pedido.estado === EstadoPedido.LISTO ? "Listo para envío"
                                            : pedido.estado === EstadoPedido.EN_CAMINO ? "En camino"
                                                : pedido.estado === EstadoPedido.ENTREGADO ? "Entregado"
                                                    : pedido.estado === EstadoPedido.CANCELADO ? "Cancelado"
                                                        : pedido.estado || "desconocido"}
                        </span>
                    </div>
                    <div>
                        <div className="text-sm text-gray-600">Total</div>
                        <div className="text-lg font-semibold text-green-700">
                            ${pedido.total?.toLocaleString("es-CO") || 0}
                        </div>
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
                        pedido.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm border-b pb-2">
                                <div>
                                    <div className="font-medium">{item.nombre || "Producto sin nombre"}</div>
                                    <div className="text-xs text-gray-600">ID: {item.productoId}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-medium">
                                        {item.cantidad} x ${item.precio_cop?.toLocaleString("es-CO") || 0} COP
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        Subtotal: ${item.subtotal?.toLocaleString("es-CO") || 0}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-sm text-gray-500">No hay items en este pedido.</div>
                    )}
                </div>
            </div>

            {/* Cupón aplicado (si hay) */}
            {pedido.coupon && (
                <div className="mb-6 p-4 border-2 border-green-200 rounded-lg bg-green-50">
                    <h2 className="text-lg font-semibold mb-3 text-green-800">Cupón Aplicado</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-gray-700">Código:</span> {" "}
                            <span className="font-mono text-green-700">{pedido.coupon.code}</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Descuento:</span> {" "}
                            <span className="font-semibold text-green-700">
                                -${pedido.coupon.descuentoCOP?.toLocaleString("es-CO") || 0}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Resumen de totales */}
            {(pedido.discount ?? 0) > 0 && (
                <div className="mb-6 p-4 border rounded-lg bg-blue-50">
                    <h2 className="text-lg font-semibold mb-3">Resumen de Precios</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-700">Subtotal:</span>
                            <span className="font-medium">
                                ${(pedido.totalOriginal ?? pedido.total).toLocaleString("es-CO")}
                            </span>
                        </div>
                        <div className="flex justify-between text-green-700">
                            <span className="font-medium">Descuento aplicado:</span>
                            <span className="font-semibold">
                                -${(pedido.discount ?? 0).toLocaleString("es-CO")}
                            </span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-semibold text-lg">
                            <span>Total a pagar:</span>
                            <span className="text-green-700">${pedido.total.toLocaleString("es-CO")}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Acciones */}
            <div className="flex flex-col gap-3 mb-6">
                {error && (
                    <div className="p-3 bg-red-100 text-red-800 rounded text-sm">
                        Error: {error}
                    </div>
                )}
                <div className="flex gap-3 flex-wrap">
                    {/* Aceptar: desde NUEVO a ACEPTADO */}
                    <button
                        onClick={() => handleEstadoChange(EstadoPedido.ACEPTADO)}
                        disabled={
                            actionInProgress !== null ||
                            pedido.estado !== EstadoPedido.NUEVO
                        }
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {actionInProgress === EstadoPedido.ACEPTADO ? "Aceptando..." : "Aceptar Pedido"}
                    </button>

                    {/* Preparando: desde ACEPTADO a PREPARANDO */}
                    <button
                        onClick={() => handleEstadoChange(EstadoPedido.PREPARANDO)}
                        disabled={
                            actionInProgress !== null ||
                            pedido.estado !== EstadoPedido.ACEPTADO
                        }
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {actionInProgress === EstadoPedido.PREPARANDO ? "Preparando..." : "Empezar Preparación"}
                    </button>

                    {/* Listo: desde PREPARANDO a LISTO */}
                    <button
                        onClick={() => handleEstadoChange(EstadoPedido.LISTO)}
                        disabled={
                            actionInProgress !== null ||
                            pedido.estado !== EstadoPedido.PREPARANDO
                        }
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {actionInProgress === EstadoPedido.LISTO ? "Finalizando..." : "Listo para envío"}
                    </button>

                    {/* Cancelar: desde cualquier estado no terminal */}
                    <button
                        onClick={() => handleEstadoChange(EstadoPedido.CANCELADO)}
                        disabled={
                            actionInProgress !== null ||
                            pedido.estado === EstadoPedido.ENTREGADO ||
                            pedido.estado === EstadoPedido.CANCELADO
                        }
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {actionInProgress === EstadoPedido.CANCELADO ? "Cancelando..." : "Cancelar Pedido"}
                    </button>

                    <Link
                        href="/bodega/pedidos"
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                        Volver a lista
                    </Link>
                </div>
            </div>

            {/* Info de persistencia */}
            <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                Estado guardado en servidor (data/pedidos.json).
            </div>
        </div>
    );
}
