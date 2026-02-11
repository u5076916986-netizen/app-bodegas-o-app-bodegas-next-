"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { buildFuseIndex, smartSearch } from "@/lib/smartSearch";
import { expandQuery } from "@/lib/synonyms";

type PedidoListItem = {
    id?: string;
    pedidoId?: string;
    bodegaId?: string;
    estado?: string;
    repartidorId?: string | null;
    repartidorNombre?: string | null;
    cliente?: { nombre?: string };
    datosEntrega?: { nombre?: string; direccion?: string };
    direccion?: string;
    total?: number;
    createdAt?: string;
};

type Repartidor = {
    id: string;
    nombre: string;
    telefono?: string;
    bodegaId: string;
};

const estados = ["nuevo", "confirmado", "en_ruta", "entregado", "cancelado"] as const;
const asignacion = ["todos", "asignado", "sin_asignar"] as const;

const getEstadoBadge = (estado?: string) => {
    const normalized = estado || "nuevo";
    const map: Record<string, string> = {
        nuevo: "bg-slate-100 text-slate-700",
        recibido: "bg-slate-100 text-slate-700",
        confirmado: "bg-blue-100 text-blue-800",
        en_ruta: "bg-orange-100 text-orange-800",
        entregado: "bg-green-100 text-green-800",
        cancelado: "bg-red-100 text-red-800",
    };
    return map[normalized] || "bg-slate-100 text-slate-700";
};

export default function PedidosBodega({ bodegaId }: { bodegaId: string }) {
    const [pedidos, setPedidos] = useState<PedidoListItem[]>([]);
    const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [q, setQ] = useState("");
    const [estado, setEstado] = useState("todos");
    const [asignacionFilter, setAsignacionFilter] = useState("todos");
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [selectedRepartidorByPedido, setSelectedRepartidorByPedido] = useState<Record<string, string>>({});
    const [range, setRange] = useState<"all" | "today">("all");
    const searchParams = useSearchParams();
    const filterAppliedRef = useRef(false);

    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.set("bodegaId", bodegaId);
        if (estado !== "todos") {
            params.set("estado", estado);
        }
        if (q.trim()) {
            params.set("q", q.trim());
        }
        return params.toString();
    }, [bodegaId, estado, q]);

    const fetchRepartidores = async () => {
        try {
            const res = await fetch(`/data/repartidores.json`, { cache: "no-store" });
            if (!res.ok) throw new Error("No se pudo cargar repartidores");
            const data = await res.json();
            const filtered = data.filter((r: Repartidor) => r.bodegaId === bodegaId);
            setRepartidores(filtered);
        } catch (err) {
            console.error("Error fetching repartidores:", err);
        }
    };

    const fetchPedidos = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/pedidos?${queryParams}`, { cache: "no-store" });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data?.error || "No se pudieron cargar los pedidos");
                setPedidos([]);
                return;
            }
            let data = await res.json();
            let filteredPedidos = data.pedidos || [];

            // Aplicar filtro de asignación
            if (asignacionFilter === "asignado") {
                filteredPedidos = filteredPedidos.filter((p: PedidoListItem) => p.repartidorId);
            } else if (asignacionFilter === "sin_asignar") {
                filteredPedidos = filteredPedidos.filter((p: PedidoListItem) => !p.repartidorId);
            }

            setPedidos(filteredPedidos);
        } catch (err) {
            console.error("Error fetching pedidos:", err);
            setError("Error de red al cargar pedidos");
            setPedidos([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRepartidores();
    }, [bodegaId]);

    useEffect(() => {
        fetchPedidos();
    }, [queryParams, asignacionFilter]);

    useEffect(() => {
        if (filterAppliedRef.current) return;
        const statusParam = searchParams.get("status");
        const rangeParam = searchParams.get("range");

        if (statusParam) {
            const normalizedStatus = statusParam === "pendiente" ? "nuevo" : statusParam;
            if (["todos", ...estados].includes(normalizedStatus)) {
                setEstado(normalizedStatus);
            }
        }

        if (rangeParam === "today") {
            setRange("today");
        }

        if (statusParam || rangeParam) {
            filterAppliedRef.current = true;
        }
    }, [searchParams]);

    const { fuse } = useMemo(() => {
        const enriched = pedidos.map((p) => ({
            ...p,
            nombre: p.cliente?.nombre ?? p.datosEntrega?.nombre ?? "",
            sku: p.pedidoId ?? p.id ?? "",
            categoria: p.estado ?? "",
            tags: [p.direccion ?? p.datosEntrega?.direccion ?? "", p.repartidorNombre ?? ""],
            unidad: "",
            presentacion: "",
        }));
        return buildFuseIndex(enriched);
    }, [pedidos]);

    const filteredPedidos = useMemo(() => {
        const matchesRange = (pedido: PedidoListItem) => {
            if (range !== "today") return true;
            const rawDate = pedido.createdAt || "";
            const date = new Date(rawDate);
            if (Number.isNaN(date.getTime())) return false;
            const now = new Date();
            return (
                date.getFullYear() === now.getFullYear() &&
                date.getMonth() === now.getMonth() &&
                date.getDate() === now.getDate()
            );
        };

        let list = pedidos.filter(matchesRange);
        if (!q.trim()) return list;
        const expanded = expandQuery(q);
        return smartSearch(fuse, expanded, 200) as PedidoListItem[];
    }, [pedidos, q, fuse, range]);

    const updateEstado = async (pedidoId: string, nextEstado: string) => {
        setActionLoading(pedidoId);
        setError(null);
        try {
            const res = await fetch(`/api/pedidos/${encodeURIComponent(pedidoId)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ estado: nextEstado }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data?.error || "No se pudo actualizar el estado");
                return;
            }

            await fetchPedidos();
        } catch (err) {
            console.error("Error actualizando pedido:", err);
            setError("Error de red al actualizar el pedido");
        } finally {
            setActionLoading(null);
        }
    };

    const assignRepartidor = async (pedidoId: string, repartidorId: string) => {
        setActionLoading(pedidoId);
        setError(null);
        try {
            const repartidor = repartidores.find((r) => r.id === repartidorId);
            const res = await fetch(`/api/pedidos/${encodeURIComponent(pedidoId)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    repartidorId: repartidorId,
                    repartidorNombre: repartidor?.nombre || "",
                    repartidorTelefono: repartidor?.telefono || "",
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data?.error || "No se pudo asignar el repartidor");
                return;
            }

            await fetchPedidos();
        } catch (err) {
            console.error("Error asignando repartidor:", err);
            setError("Error de red al asignar el repartidor");
        } finally {
            setActionLoading(null);
        }
    };

    const handleAssign = (pedidoId: string) => {
        const selected = selectedRepartidorByPedido[pedidoId] || "";
        if (!selected) {
            setError("Selecciona un repartidor antes de asignar");
            return;
        }
        assignRepartidor(pedidoId, selected);
    };

    const handleConfirmar = (pedidoId: string) => updateEstado(pedidoId, "confirmado");

    const handleCancelar = (pedidoId: string) => {
        if (!window.confirm("¿Deseas cancelar este pedido?")) return;
        updateEstado(pedidoId, "cancelado");
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-7xl px-4 py-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">Pedidos</h1>
                    <p className="text-slate-600 mt-1">Bodega {bodegaId}</p>
                    {range === "today" ? (
                        <p className="text-sm text-slate-500 mt-1">Mostrando pedidos de hoy</p>
                    ) : null}
                </div>

                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label htmlFor="q" className="block text-sm font-medium text-slate-700 mb-1">
                                Buscar
                            </label>
                            <input
                                id="q"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="ID, cliente o dirección"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="estado" className="block text-sm font-medium text-slate-700 mb-1">
                                Estado
                            </label>
                            <select
                                id="estado"
                                value={estado}
                                onChange={(e) => setEstado(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="todos">Todos</option>
                                {estados.map((st) => (
                                    <option key={st} value={st}>
                                        {st.replace("_", " ")}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="asignacion" className="block text-sm font-medium text-slate-700 mb-1">
                                Asignación
                            </label>
                            <select
                                id="asignacion"
                                value={asignacionFilter}
                                onChange={(e) => setAsignacionFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="todos">Todos</option>
                                <option value="asignado">Asignados</option>
                                <option value="sin_asignar">Sin asignar</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={fetchPedidos}
                                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                            >
                                Buscar
                            </button>
                        </div>
                    </div>
                </div>

                {error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4">
                        {error}
                    </div>
                ) : null}

                {loading ? (
                    <div className="p-6">Cargando pedidos...</div>
                ) : filteredPedidos.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-10 text-center">
                        <p className="text-slate-500">No hay pedidos para esta bodega.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Cliente</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Dirección</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Estado</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Repartidor</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Fecha</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {filteredPedidos.map((pedido, index) => {
                                        const pedidoId = pedido.pedidoId || pedido.id || "";
                                        const clienteNombre = pedido.datosEntrega?.nombre || pedido.cliente?.nombre || "Sin nombre";
                                        const direccion = pedido.datosEntrega?.direccion || pedido.direccion || "Sin dirección";
                                        const estadoActual = pedido.estado || "nuevo";
                                        const isFinal = estadoActual === "entregado" || estadoActual === "cancelado";
                                        const canConfirm = estadoActual === "nuevo" || estadoActual === "recibido";

                                        return (
                                            <tr key={pedidoId || `pedido-${index}`} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 text-sm font-mono text-slate-900">
                                                    {pedidoId || "Sin ID"}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-700">
                                                    {clienteNombre}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-700">
                                                    {direccion}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadge(estadoActual)}`}>
                                                        {estadoActual.replace("_", " ")}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-700">
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-xs text-slate-500">
                                                            {pedido.repartidorNombre || "Sin asignar"}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <label htmlFor={`repartidor-${pedidoId}`} className="sr-only">
                                                                Seleccionar repartidor
                                                            </label>
                                                            <select
                                                                id={`repartidor-${pedidoId}`}
                                                                value={selectedRepartidorByPedido[pedidoId] ?? pedido.repartidorId ?? ""}
                                                                onChange={(e) =>
                                                                    setSelectedRepartidorByPedido((prev) => ({
                                                                        ...prev,
                                                                        [pedidoId]: e.target.value,
                                                                    }))
                                                                }
                                                                className="px-2 py-1 border border-slate-300 rounded-lg text-sm"
                                                            >
                                                                <option value="">-- Sin asignar --</option>
                                                                {repartidores.map((rep) => (
                                                                    <option key={rep.id} value={rep.id}>
                                                                        {rep.nombre}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                onClick={() => handleAssign(pedidoId)}
                                                                disabled={actionLoading === pedidoId}
                                                                className="px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 disabled:opacity-60"
                                                            >
                                                                Asignar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-700">
                                                    {pedido.total ? `$${pedido.total.toLocaleString("es-CO")}` : "-"}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {pedido.createdAt ? new Date(pedido.createdAt).toLocaleString("es-CO") : "-"}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {pedidoId ? (
                                                            <Link
                                                                href={`/entregas/${encodeURIComponent(pedidoId)}`}
                                                                className="px-3 py-1 bg-slate-900 text-white text-sm rounded hover:bg-slate-800"
                                                            >
                                                                Ver detalle
                                                            </Link>
                                                        ) : (
                                                            <span className="px-3 py-1 text-sm text-slate-400 bg-slate-100 rounded">Sin ID</span>
                                                        )}

                                                        {pedidoId && canConfirm ? (
                                                            <button
                                                                onClick={() => handleConfirmar(pedidoId)}
                                                                disabled={actionLoading === pedidoId}
                                                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-60"
                                                            >
                                                                Confirmar
                                                            </button>
                                                        ) : null}

                                                        {pedidoId && !isFinal ? (
                                                            <button
                                                                onClick={() => handleCancelar(pedidoId)}
                                                                disabled={actionLoading === pedidoId}
                                                                className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 disabled:opacity-60"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
