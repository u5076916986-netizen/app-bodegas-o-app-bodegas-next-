"use client";

import type { Pedido } from "@/lib/pedidos";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PedidosClient({
    initialPedidos,
    bodegaId,
}: {
    initialPedidos: Pedido[];
    bodegaId: string;
}) {
    const [pedidos, setPedidos] = useState<Pedido[]>(initialPedidos);
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Auto-refresh cada 10 segundos si está habilitado
    useEffect(() => {
        if (!autoRefresh || !bodegaId) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(
                    `/api/pedidos?role=bodega&bodegaId=${encodeURIComponent(bodegaId)}`
                );
                if (res.ok) {
                    const data = (await res.json()) as {
                        ok: boolean;
                        pedidos: Pedido[];
                    };
                    if (data.ok) {
                        setPedidos(data.pedidos || []);
                    }
                }
            } catch (err) {
                console.error("Error refreshing pedidos", err);
            }
        }, 10000); // Cada 10 segundos

        return () => clearInterval(interval);
    }, [autoRefresh, bodegaId]);
    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                    Total de pedidos: {pedidos.length}
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                        type="checkbox"
                        checked={autoRefresh}
                        onChange={(e) => setAutoRefresh(e.target.checked)}
                        className="w-4 h-4"
                    />
                    Auto-actualizar
                </label>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                    <thead>
                        <tr className="text-left bg-gray-100">
                            <th className="p-3 border">ID Pedido</th>
                            <th className="p-3 border">Fecha</th>
                            <th className="p-3 border">Tendero</th>
                            <th className="p-3 border">Total (COP)</th>
                            <th className="p-3 border">Estado</th>
                            <th className="p-3 border">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pedidos.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-4 text-center text-gray-500">
                                    No hay pedidos registrados.
                                </td>
                            </tr>
                        ) : (
                            pedidos.map((pedido) => (
                                <tr key={pedido.pedidoId} className="odd:bg-white even:bg-gray-50">
                                    <td className="p-3 border text-sm font-mono">
                                        {pedido.pedidoId.substring(0, 8)}...
                                    </td>
                                    <td className="p-3 border text-sm">
                                        {pedido.createdAt
                                            ? new Date(pedido.createdAt).toISOString().replace("T", " ").slice(0, 16)
                                            : "-"}
                                    </td>
                                    <td className="p-3 border text-sm">
                                        {pedido.datosEntrega?.nombre || "Sin nombre"}
                                    </td>
                                    <td className="p-3 border text-sm font-semibold">
                                        ${pedido.total?.toLocaleString("es-CO") || 0}
                                    </td>
                                    <td className="p-3 border">
                                        <span
                                            className={`px-3 py-1 rounded text-xs font-semibold ${pedido.estado === "nuevo"
                                                ? "bg-slate-100 text-slate-700"
                                                : pedido.estado === "confirmado"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : pedido.estado === "en_ruta"
                                                        ? "bg-orange-100 text-orange-800"
                                                        : pedido.estado === "entregado"
                                                            ? "bg-green-100 text-green-800"
                                                            : pedido.estado === "cancelado"
                                                                ? "bg-red-100 text-red-800"
                                                                : "bg-gray-100 text-gray-800"
                                                }`}
                                        >
                                            {pedido.estado || "desconocido"}
                                        </span>
                                    </td>
                                    <td className="p-3 border">
                                        <Link
                                            href={`/bodega/pedidos/${pedido.pedidoId}`}
                                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                        >
                                            Ver detalle
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
