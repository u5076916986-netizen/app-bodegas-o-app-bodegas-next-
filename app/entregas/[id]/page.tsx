import Link from "next/link";
import { headers } from "next/headers";

interface PedidoItem {
    productoId: string;
    nombre?: string;
    precio_cop?: number;
    cantidad?: number;
    subtotal?: number;
}

interface Pedido {
    pedidoId: string;
    bodegaId?: string;
    items?: PedidoItem[];
    total?: number;
    createdAt?: string;
    estado?: string;
    datosEntrega?: {
        nombre?: string;
        telefono?: string;
        direccion?: string;
        notas?: string | null;
    };
}

async function fetchPedido(id: string): Promise<Pedido | null> {
    const headerList = await headers();
    const host = headerList.get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const baseUrl = host ? `${protocol}://${host}` : "";

    const res = await fetch(`${baseUrl}/api/pedidos/${encodeURIComponent(id)}`, {
        cache: "no-store",
    });

    if (!res.ok) {
        return null;
    }

    const data = await res.json();
    return data.pedido ?? null;
}

export default async function EntregaDetallePage({
    params,
}: {
    params: { id: string };
}) {
    const pedido = await fetchPedido(params.id);

    if (!pedido) {
        return (
            <div className="min-h-screen bg-slate-50">
                <div className="mx-auto max-w-4xl px-4 py-10">
                    <div className="bg-white rounded-xl shadow p-8 text-center">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            Pedido no encontrado
                        </h1>
                        <p className="text-slate-600 mb-6">
                            No se pudo cargar el detalle del pedido. Verifica el ID e intenta nuevamente.
                        </p>
                        <Link
                            href="/inicio"
                            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                        >
                            Volver
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const items = pedido.items ?? [];
    const totalItems = items.reduce((sum, item) => sum + (item.cantidad ?? 0), 0);
    const totalPedido = pedido.total ?? items.reduce((sum, item) => sum + (item.subtotal ?? 0), 0);

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-5xl px-4 py-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Detalle del Pedido</h1>
                            <p className="text-slate-600 mt-2">
                                ID: <span className="font-mono">{pedido.pedidoId}</span>
                            </p>
                        </div>
                        {pedido.estado ? (
                            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 capitalize">
                                {pedido.estado.replace("_", " ")}
                            </span>
                        ) : null}
                    </div>
                </div>

                {/* Info blocks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-3">Cliente</h2>
                        <p className="text-sm text-slate-700">
                            <strong>Nombre:</strong> {pedido.datosEntrega?.nombre || "Sin nombre"}
                        </p>
                        <p className="text-sm text-slate-700 mt-1">
                            <strong>Teléfono:</strong> {pedido.datosEntrega?.telefono || "Sin teléfono"}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-3">Entrega</h2>
                        <p className="text-sm text-slate-700">
                            <strong>Dirección:</strong> {pedido.datosEntrega?.direccion || "Sin dirección"}
                        </p>
                        <p className="text-sm text-slate-700 mt-1">
                            <strong>Notas:</strong> {pedido.datosEntrega?.notas || "Sin notas"}
                        </p>
                    </div>
                </div>

                {/* Items */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-lg font-bold text-slate-900">Items</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Producto</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Cantidad</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Precio</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-6 text-center text-slate-500">
                                            Sin items registrados
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item, index) => (
                                        <tr key={`${item.productoId}-${index}`} className="hover:bg-slate-50">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-slate-900">
                                                    {item.nombre || item.productoId || "Producto"}
                                                </p>
                                                {item.productoId ? (
                                                    <p className="text-xs text-slate-500">{item.productoId}</p>
                                                ) : null}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700">
                                                {item.cantidad ?? 0}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700">
                                                {item.precio_cop ? `$${item.precio_cop.toLocaleString("es-CO")}` : "-"}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700">
                                                {item.subtotal ? `$${item.subtotal.toLocaleString("es-CO")}` : "-"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totals */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Total items</p>
                            <p className="text-xl font-bold text-slate-900">{totalItems}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-600">Total pedido</p>
                            <p className="text-2xl font-bold text-slate-900">
                                ${totalPedido.toLocaleString("es-CO")}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Back button */}
                <div className="flex justify-end">
                    <Link
                        href="/inicio"
                        className="inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                    >
                        Volver a inicio
                    </Link>
                </div>
            </div>
        </div>
    );
}
