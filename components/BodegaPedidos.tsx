"use client";

import { useEffect, useState } from "react";
import PedidoDetalleModal from "@/components/PedidoDetalleModal";

interface Pedido {
    id: string;
    pedidoId: string;
    estado: string;
    cliente: { nombre: string; telefono: string };
    direccion: string;
    items: { nombre: string; cantidad: number; precio: number }[];
    total: number;
    createdAt: string;
}

export default function BodegaPedidos() {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);
    const [detalleOpen, setDetalleOpen] = useState(false);
    const [detallePedido, setDetallePedido] = useState<Pedido | null>(null);

    useEffect(() => {
        async function fetchPedidos() {
            setLoading(true);
            try {
                const res = await fetch("/api/pedidos?role=bodega&bodegaId=BOD_001");
                const data = await res.json();
                if (data.ok) setPedidos(data.pedidos || []);
                else setError(data.error || "Error cargando pedidos");
            } catch {
                setError("Error cargando pedidos");
            } finally {
                setLoading(false);
            }
        }
        fetchPedidos();
    }, []);

    const handleUpdateEstado = async (pedidoId: string, estado: string) => {
        setUpdating(pedidoId);
        try {
            const res = await fetch(`/api/pedidos`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pedidoId, estado }),
            });
            if (res.ok) {
                setPedidos((prev) =>
                    prev.map((p) => (p.pedidoId === pedidoId ? { ...p, estado } : p))
                );
            }
        } finally {
            setUpdating(null);
        }
    };

    if (loading) return <div className="text-center py-12 text-slate-500">Cargando pedidos...</div>;
    if (error) return <div className="text-center text-red-600">{error}</div>;

    const pedidosConfirmados = pedidos.filter((p) => p.estado === "confirmado" || p.estado === "en_preparacion" || p.estado === "listo");

    return (
        <div className="space-y-6">
            <PedidoDetalleModal open={detalleOpen} onClose={() => setDetalleOpen(false)} pedido={detallePedido} />
            {pedidosConfirmados.length === 0 ? (
                <div className="text-center text-slate-500">No hay pedidos recibidos.</div>
            ) : (
                <div className="space-y-4">
                    {pedidosConfirmados.map((pedido) => (
                        <div key={pedido.pedidoId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <div className="font-bold text-slate-900">Pedido {pedido.pedidoId}</div>
                                <div className="text-xs text-slate-500">{new Date(pedido.createdAt).toLocaleString()}</div>
                                <div className="text-xs font-semibold text-blue-700">Estado: {pedido.estado}</div>
                            </div>
                            <div className="mb-2 text-sm text-slate-700">
                                Cliente: <span className="font-semibold">{pedido.cliente?.nombre}</span> · {pedido.cliente?.telefono}<br />
                                Dirección: <span className="font-semibold">{pedido.direccion}</span>
                            </div>
                            <div className="mb-2">
                                <ul className="text-xs text-slate-700 list-disc ml-4">
                                    {pedido.items.map((item, idx) => (
                                        <li key={idx}>{item.nombre} × {item.cantidad} <span className="text-slate-500">(${item.precio.toLocaleString("es-CO")})</span></li>
                                    ))}
                                </ul>
                            </div>
                            <div className="font-bold text-right text-lg text-green-700 mb-2">
                                Total: ${pedido.total.toLocaleString("es-CO")}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    className="rounded bg-slate-200 text-slate-700 px-3 py-1 text-sm font-semibold hover:bg-slate-300"
                                    onClick={() => { setDetallePedido(pedido); setDetalleOpen(true); }}
                                >
                                    Ver detalles
                                </button>
                                {pedido.estado === "confirmado" && (
                                    <button
                                        className="rounded bg-yellow-500 text-white px-3 py-1 text-sm font-semibold hover:bg-yellow-600 disabled:opacity-60"
                                        onClick={() => handleUpdateEstado(pedido.pedidoId, "en_preparacion")}
                                        disabled={updating === pedido.pedidoId}
                                    >
                                        Preparar pedido
                                    </button>
                                )}
                                {pedido.estado === "en_preparacion" && (
                                    <button
                                        className="rounded bg-blue-600 text-white px-3 py-1 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                                        onClick={() => handleUpdateEstado(pedido.pedidoId, "listo")}
                                        disabled={updating === pedido.pedidoId}
                                    >
                                        Listo para envío
                                    </button>
                                )}
                                {pedido.estado === "listo" && (
                                    <span className="rounded bg-green-100 text-green-700 px-3 py-1 text-sm font-semibold">Listo para envío</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
