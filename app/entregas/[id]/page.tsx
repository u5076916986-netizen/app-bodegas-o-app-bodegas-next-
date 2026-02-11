import Link from "next/link";
import { headers } from "next/headers";
import PedidoActions from "./PedidoActions";
import { getLedgerEntryByPedidoId } from "@/lib/ledger";
import { getBodegaById } from "@/lib/csv";
import Breadcrumbs from "@/app/ui/Breadcrumbs";
import IncidenciaChip from "@/components/IncidenciaChip";
import RouteAction from "./RouteAction";

interface PedidoItem {
    productoId: string;
    nombre?: string;
    precio_cop?: number;
    precio?: number;
    cantidad?: number;
    subtotal?: number;
}

interface Pedido {
    pedidoId: string;
    id?: string;
    bodegaId?: string;
    repartidorId?: string | null;
    repartidorNombre?: string | null;
    repartidorTelefono?: string | null;
    cliente?: {
        nombre?: string;
        telefono?: string;
    };
    direccion?: string;
    zona?: string;
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
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const safeId = id ? decodeURIComponent(id) : "";

    if (!safeId) {
        return (
            <div className="min-h-screen bg-slate-50">
                <div className="mx-auto max-w-4xl px-4 py-10">
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            Pedido no encontrado
                        </h1>
                        <p className="text-slate-600 mb-6">
                            El ID del pedido es inválido.
                        </p>
                        <Link
                            href="/inicio"
                            className="inline-flex items-center rounded-full bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
                        >
                            Volver
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const pedido = await fetchPedido(safeId);

    if (!pedido) {
        return (
            <div className="min-h-screen bg-slate-50">
                <div className="mx-auto max-w-4xl px-4 py-10">
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            Pedido no encontrado
                        </h1>
                        <p className="text-slate-600 mb-6">
                            No se pudo cargar el detalle del pedido. Verifica el ID e intenta nuevamente.
                        </p>
                        <Link
                            href="/inicio"
                            className="inline-flex items-center rounded-full bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
                        >
                            Volver
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const items = pedido.items ?? [];
    const pedidoRealId = pedido.id || pedido.pedidoId || safeId;
    const bodegaId = pedido.bodegaId || "";
    const bodega = bodegaId ? await getBodegaById(bodegaId) : null;
    const ledgerEntry = await getLedgerEntryByPedidoId(pedidoRealId);
    const recompensasAplicadas = Boolean(ledgerEntry);
    const puntosTendero = ledgerEntry?.puntosTendero ?? 0;
    const gananciaRepartidor = ledgerEntry?.gananciaRepartidor ?? 0;
    const clienteNombre = pedido.datosEntrega?.nombre || pedido.cliente?.nombre || "Sin nombre";
    const clienteTelefono = pedido.datosEntrega?.telefono || pedido.cliente?.telefono || "Sin teléfono";
    const direccion = pedido.datosEntrega?.direccion || pedido.direccion || "Sin dirección";
    const notas = pedido.datosEntrega?.notas ?? "Sin notas";
    const repartidorNombre = pedido.repartidorNombre || pedido.repartidorId || "Sin asignar";
    const repartidorTelefono = pedido.repartidorTelefono || "Sin teléfono";
    const totalItems = items.reduce((sum, item) => sum + (item.cantidad ?? 0), 0);
    const totalPedido = pedido.total ?? items.reduce((sum, item) => sum + (item.subtotal ?? 0), 0);
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
        }).format(value);
    const pagoRepartidorLabel = recompensasAplicadas
        ? formatCurrency(gananciaRepartidor)
        : "Pendiente";

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-5xl px-4 py-8">
                <div className="mb-4">
                    <Breadcrumbs
                        items={[
                            { label: "Inicio", href: "/inicio" },
                            { label: "Mis entregas", href: "/repartidor/entregas" },
                            { label: "Detalle" },
                        ]}
                    />
                </div>
                {/* Header */}
                <div className="mb-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Entrega</p>
                            <h1 className="text-3xl font-bold text-slate-900">Detalle del Pedido</h1>
                            <p className="text-slate-600 mt-2">
                                ID: <span className="font-mono">{pedido.pedidoId}</span>
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {pedido.estado ? (
                                <span className="px-4 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 capitalize">
                                    {pedido.estado.replace("_", " ")}
                                </span>
                            ) : null}
                            <IncidenciaChip pedidoId={pedidoRealId} />
                        </div>
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                        <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 mb-1">Pago repartidor</p>
                        <p className="text-2xl font-bold text-emerald-900">{pagoRepartidorLabel}</p>
                        <p className="text-xs text-emerald-700 mt-1">
                            {recompensasAplicadas ? "Ganancia confirmada" : "Se calcula al entregar"}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-1">Total pedido</p>
                        <p className="text-2xl font-bold text-slate-900">
                            {totalPedido > 0 ? formatCurrency(totalPedido) : "-"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Items: {totalItems}</p>
                    </div>
                </div>

                <PedidoActions
                    id={pedidoRealId}
                    estado={pedido.estado || "nuevo"}
                    repartidorId={pedido.repartidorId}
                />

                {/* Info blocks */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-3">Recoger en bodega</h2>
                        <p className="text-sm text-slate-700">
                            <strong>Bodega:</strong> {(bodega?.nombre ?? bodegaId) || "Sin bodega"}
                        </p>
                        <p className="text-sm text-slate-700 mt-1">
                            <strong>Dirección:</strong> {bodega?.direccion ?? "Sin dirección"}
                        </p>
                        <p className="text-sm text-slate-700 mt-1">
                            <strong>Teléfono:</strong> {bodega?.telefono ?? "Sin teléfono"}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-3">Entregar a cliente</h2>
                        <p className="text-sm text-slate-700">
                            <strong>Nombre:</strong> {clienteNombre}
                        </p>
                        <p className="text-sm text-slate-700 mt-1">
                            <strong>Teléfono:</strong> {clienteTelefono}
                        </p>
                        <p className="text-sm text-slate-700 mt-1">
                            <strong>Dirección:</strong> {direccion}
                        </p>
                        <p className="text-sm text-slate-700 mt-1">
                            <strong>Notas:</strong> {notas || "Sin notas"}
                        </p>
                        <RouteAction
                            pedidoId={pedidoRealId}
                            direccion={pedido.datosEntrega?.direccion || pedido.direccion || null}
                            zona={pedido.zona || null}
                        />
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-3">Repartidor</h2>
                        <p className="text-sm text-slate-700">
                            <strong>Asignado:</strong> {repartidorNombre}
                        </p>
                        <p className="text-sm text-slate-700 mt-1">
                            <strong>Teléfono:</strong> {repartidorTelefono}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Recompensas</h2>
                            <p className="text-sm text-slate-500">
                                Se generan al marcar el pedido como entregado.
                            </p>
                        </div>
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${recompensasAplicadas
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                                }`}
                        >
                            {recompensasAplicadas ? "Aplicadas" : "Pendientes"}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Puntos tendero</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {recompensasAplicadas ? puntosTendero : "-"}
                            </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Ganancia repartidor</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {recompensasAplicadas
                                    ? formatCurrency(gananciaRepartidor)
                                    : "-"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
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
                                    items.map((item) => (
                                        <tr
                                            key={`${pedidoRealId}-${item.productoId || item.nombre || "item"}-${item.cantidad ?? ""}`}
                                            className="hover:bg-slate-50"
                                        >
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
                                                {item.precio_cop ?? item.precio
                                                    ? formatCurrency(item.precio_cop ?? item.precio ?? 0)
                                                    : "-"}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700">
                                                {item.subtotal
                                                    ? formatCurrency(item.subtotal)
                                                    : item.precio && item.cantidad
                                                        ? formatCurrency(item.precio * item.cantidad)
                                                        : "-"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totals */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Total items</p>
                            <p className="text-xl font-bold text-slate-900">{totalItems}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-600">Total pedido</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {formatCurrency(totalPedido)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Back button */}
                <div className="flex justify-end">
                    <Link
                        href="/inicio"
                        className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
                    >
                        Volver a inicio
                    </Link>
                </div>
            </div>
        </div>
    );
}
