"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Modal from "@/components/Modal";
import { buildFuseIndex, smartSearch } from "@/lib/smartSearch";
import { expandQuery } from "@/lib/synonyms";
import RepartidorNotifications from "@/components/RepartidorNotifications";
import { useRouter, useSearchParams } from "next/navigation";

interface PedidoListItem {
    id?: string;
    pedidoId?: string;
    bodegaId?: string;
    estado?: string;
    total?: number;
    metodoPago?: string;
    datosEntrega?: {
        nombre?: string;
        direccion?: string;
    };
    cliente?: {
        nombre?: string;
    };
    direccion?: string;
    zona?: string;
    createdAt?: string;
    updatedAt?: string;
}

const REPARTIDOR_ID = "REP_001";

const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
        nuevo: "bg-slate-100 text-slate-700",
        confirmado: "bg-blue-100 text-blue-800",
        asignado: "bg-indigo-100 text-indigo-800",
        en_bodega: "bg-amber-100 text-amber-800",
        recogido: "bg-amber-100 text-amber-800",
        en_ruta: "bg-orange-100 text-orange-800",
        entregado: "bg-green-100 text-green-800",
        cancelado: "bg-red-100 text-red-800",
    };
    return colors[estado] || "bg-slate-100 text-slate-700";
};

const getEstadoLabel = (estado: string) => {
    if (estado === "asignado") return "asignado";
    if (estado === "en_bodega") return "en bodega";
    if (estado === "recogido") return "recogido";
    return estado.replace("_", " ");
};

const sortPedidos = (items: PedidoListItem[]) => {
    const order: Record<string, number> = {
        confirmado: 0,
        nuevo: 0,
        asignado: 1,
        en_bodega: 2,
        recogido: 3,
        en_ruta: 4,
        entregado: 5,
        cancelado: 6,
    };
    return [...items].sort((a, b) => {
        const aOrder = order[a.estado || ""] ?? 99;
        const bOrder = order[b.estado || ""] ?? 99;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return String(b.updatedAt || b.createdAt || "").localeCompare(
            String(a.updatedAt || a.createdAt || ""),
        );
    });
};

export default function RepartidorEntregas() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [pedidos, setPedidos] = useState<PedidoListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [gananciasHoy, setGananciasHoy] = useState<number | null>(null);
    const [gananciasSemana, setGananciasSemana] = useState<number | null>(null);
    const [gananciasTotal, setGananciasTotal] = useState<number | null>(null);
    const [pendientePago, setPendientePago] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<"pendientes" | "en_ruta" | "entregadas" | "incidencias">("pendientes");
    const [problemOpen, setProblemOpen] = useState(false);
    const [problemPedidoId, setProblemPedidoId] = useState<string | null>(null);
    const [problemEstado, setProblemEstado] = useState<string | null>(null);
    const [problemReason, setProblemReason] = useState("cliente_no_responde");
    const [problemDetail, setProblemDetail] = useState("");
    const [problemStatus, setProblemStatus] = useState<string | null>(null);
    const [incidencias, setIncidencias] = useState<Record<string, boolean>>({});
    const [searchQ, setSearchQ] = useState("");
    const [mounted, setMounted] = useState(false);
    const [routeOpen, setRouteOpen] = useState(false);
    const [routeAddress, setRouteAddress] = useState("");
    const [routePedidoId, setRoutePedidoId] = useState<string | null>(null);
    const [routeEstado, setRouteEstado] = useState<string | null>(null);
    const [copyStatus, setCopyStatus] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        fetchEntregas();
        fetchCuenta();
        fetchIncidencias();
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const tabParam = searchParams.get("tab");
        const searchParam = searchParams.get("q") ?? "";
        if (tabParam === "pendientes" || tabParam === "en_ruta" || tabParam === "entregadas" || tabParam === "incidencias") {
            setActiveTab(tabParam);
        }
        if (searchParam !== searchQ) {
            setSearchQ(searchParam);
        }
    }, [mounted, searchParams, searchQ]);

    const updateQuery = (nextTab?: string, nextSearch?: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (nextTab) {
            params.set("tab", nextTab);
        }
        if (nextSearch !== undefined) {
            if (nextSearch) {
                params.set("q", nextSearch);
            } else {
                params.delete("q");
            }
        }
        const query = params.toString();
        router.replace(query ? `?${query}` : "?");
    };

    const fetchEntregas = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/pedidos?repartidorId=${REPARTIDOR_ID}`, { cache: "no-store" });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data?.error || "No se pudieron cargar entregas");
                setPedidos([]);
                return;
            }
            const data = await res.json();
            setPedidos(sortPedidos(data.pedidos || []));
        } catch (error) {
            console.error("Error fetching pedidos:", error);
            setError("Error de red al cargar entregas");
        } finally {
            setLoading(false);
        }
    };

    const fetchCuenta = async () => {
        try {
            const res = await fetch(`/api/cuentas?repartidorId=${REPARTIDOR_ID}`, { cache: "no-store" });
            if (!res.ok) {
                return;
            }
            const data = await res.json();
            setGananciasHoy(Number(data?.gananciasHoy ?? 0));
            setGananciasSemana(Number(data?.gananciasSemana ?? 0));
            setGananciasTotal(Number(data?.cuenta?.ganancias ?? 0));
            setPendientePago(Number(data?.pendientePago ?? data?.cuenta?.ganancias ?? 0));
        } catch (err) {
            console.error("Error cargando cuenta:", err);
        }
    };

    const fetchIncidencias = async () => {
        try {
            const res = await fetch(`/api/incidencias?repartidorId=${REPARTIDOR_ID}`, { cache: "no-store" });
            if (!res.ok) return;
            const data = await res.json();
            if (!data.ok || !Array.isArray(data.data)) return;
            const map: Record<string, boolean> = {};
            data.data.forEach((item: any) => {
                if (item?.pedidoId) {
                    map[String(item.pedidoId)] = true;
                }
            });
            setIncidencias(map);
        } catch (err) {
            console.error("Error cargando incidencias:", err);
        }
    };

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

            await fetchEntregas();
        } catch (err) {
            console.error("Error actualizando pedido:", err);
            setError("Error de red al actualizar el pedido");
        } finally {
            setActionLoading(null);
        }
    };

    const openProblem = (pedidoId: string, estadoActual: string) => {
        setProblemPedidoId(pedidoId);
        setProblemEstado(estadoActual);
        setProblemDetail("");
        setProblemStatus(null);
        setProblemOpen(true);
    };

    const submitProblem = async () => {
        if (!problemPedidoId) return;
        setProblemStatus(null);
        try {
            setActionLoading(problemPedidoId);
            const res = await fetch("/api/incidencias", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pedidoId: problemPedidoId,
                    repartidorId: REPARTIDOR_ID,
                    estado: problemEstado,
                    motivo: problemReason,
                    detalle: problemDetail || null,
                    source: "repartidor",
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setProblemStatus(data?.error || "No se pudo registrar la incidencia");
                return;
            }

            setProblemStatus("Incidencia registrada");
            setIncidencias((prev) => ({ ...prev, [problemPedidoId]: true }));
            setProblemOpen(false);
        } catch (err) {
            setProblemStatus("Error de red al registrar la incidencia");
        } finally {
            setActionLoading(null);
        }
    };

    const { fuse } = useMemo(() => {
        const enriched = pedidos.map((p) => ({
            ...p,
            nombre: p.datosEntrega?.nombre ?? p.cliente?.nombre ?? "",
            sku: p.pedidoId ?? p.id ?? "",
            categoria: p.estado ?? "",
            tags: [p.datosEntrega?.direccion ?? p.direccion ?? "", p.zona ?? ""],
            unidad: "",
            presentacion: "",
        }));
        return buildFuseIndex(enriched);
    }, [pedidos]);

    const baseList = useMemo(() => {
        if (!searchQ.trim()) return pedidos;
        const expanded = expandQuery(searchQ);
        return smartSearch(fuse, expanded, 200) as PedidoListItem[];
    }, [pedidos, searchQ, fuse]);

    const pendientesList = baseList.filter((p) =>
        ["nuevo", "confirmado", "asignado", "en_bodega", "recogido"].includes(String(p.estado)),
    );
    const enRutaList = baseList.filter((p) => p.estado === "en_ruta");
    const entregadasList = baseList.filter((p) => p.estado === "entregado");
    const todayKey = useMemo(() => (mounted ? new Date().toDateString() : ""), [mounted]);
    const entregadasHoyList = useMemo(() => {
        if (!todayKey) return [] as PedidoListItem[];
        return entregadasList.filter((p) =>
            new Date(p.updatedAt || p.createdAt || "").toDateString() === todayKey,
        );
    }, [entregadasList, todayKey]);
    const incidenciasList = useMemo(() => {
        return baseList.filter((p) => {
            const pedidoId = p.pedidoId || p.id;
            return pedidoId ? incidencias[pedidoId] : false;
        });
    }, [baseList, incidencias]);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
        }).format(value);

    const buildMapsUrl = (destination: string) =>
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;

    const buildWazeUrl = (destination: string) =>
        `https://waze.com/ul?q=${encodeURIComponent(destination)}&navigate=yes`;

    const openRouteModal = (pedidoId: string, direccion: string, estadoActual: string) => {
        setRoutePedidoId(pedidoId);
        setRouteAddress(direccion || "");
        setRouteEstado(estadoActual || null);
        setCopyStatus(null);
        setRouteOpen(true);
    };

    const handleCopyAddress = async () => {
        if (!routeAddress) return;
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(routeAddress);
            } else {
                const el = document.createElement("textarea");
                el.value = routeAddress;
                document.body.appendChild(el);
                el.select();
                document.execCommand("copy");
                document.body.removeChild(el);
            }
            setCopyStatus("Dirección copiada");
        } catch {
            setCopyStatus("No se pudo copiar");
        }
    };

    if (!mounted) {
        return <div className="p-6">Cargando entregas...</div>;
    }

    if (loading) {
        return <div className="p-6">Cargando entregas...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-7xl px-4 py-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">Mis entregas hoy</h1>
                    <p className="text-slate-600 mt-1">Repartidor {REPARTIDOR_ID}</p>
                </div>

                <RepartidorNotifications />

                {error ? (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" id="ganancias">
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-emerald-500">
                        <p className="text-sm text-slate-600 mb-1">Ganancias hoy</p>
                        <p className="text-3xl font-bold text-slate-900">
                            {gananciasHoy !== null ? formatCurrency(gananciasHoy) : "-"}
                        </p>
                        {gananciasSemana !== null ? (
                            <p className="text-xs text-slate-500 mt-1">
                                Semana: {formatCurrency(gananciasSemana)}
                            </p>
                        ) : null}
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                        <p className="text-sm text-slate-600 mb-1">Ganancia pendiente</p>
                        <p className="text-3xl font-bold text-slate-900">
                            {pendientePago !== null ? formatCurrency(pendientePago) : "-"}
                        </p>
                        {gananciasTotal !== null ? (
                            <p className="text-xs text-slate-500 mt-1">
                                Total acumulado: {formatCurrency(gananciasTotal)}
                            </p>
                        ) : null}
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                        <p className="text-sm text-slate-600 mb-1">Entregas hoy</p>
                        <p className="text-3xl font-bold text-slate-900">{entregadasHoyList.length}</p>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow" id="historial">
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-bold text-slate-900">Entregas</h2>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {(["pendientes", "en_ruta", "entregadas", "incidencias"] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        setActiveTab(tab);
                                        updateQuery(tab, searchQ);
                                    }}
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${activeTab === tab
                                        ? "bg-slate-900 text-white"
                                        : "bg-slate-100 text-slate-700"
                                        }`}
                                >
                                    {tab === "pendientes" && `Pendientes (${pendientesList.length})`}
                                    {tab === "en_ruta" && `En ruta (${enRutaList.length})`}
                                    {tab === "entregadas" && `Entregadas hoy (${entregadasHoyList.length})`}
                                    {tab === "incidencias" && `Incidencias (${incidenciasList.length})`}
                                </button>
                            ))}
                        </div>
                        <div className="mt-4">
                            <input
                                value={searchQ}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    setSearchQ(next);
                                    updateQuery(activeTab, next);
                                }}
                                placeholder="Buscar cliente, dirección o ID"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {pedidos.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-slate-500 mb-4">No tienes entregas asignadas</p>
                            <Link
                                href="/inicio"
                                className="inline-block px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                            >
                                Volver al inicio
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-4 p-6 md:grid-cols-2">
                            {(activeTab === "pendientes"
                                ? pendientesList
                                : activeTab === "en_ruta"
                                    ? enRutaList
                                    : activeTab === "entregadas"
                                        ? entregadasHoyList
                                        : incidenciasList
                            ).map((pedido) => {
                                const pedidoId = pedido.pedidoId || pedido.id || "";
                                if (!pedidoId) return null;
                                const clienteNombre = pedido.datosEntrega?.nombre || pedido.cliente?.nombre || "Cliente sin nombre";
                                const direccion = pedido.datosEntrega?.direccion || pedido.direccion || "Dirección no disponible";
                                const estado = pedido.estado || "nuevo";
                                const total = Number(pedido.total ?? 0);
                                const metodoPago = pedido.metodoPago || "";
                                const hasIncidencia = pedidoId ? incidencias[pedidoId] : false;
                                const zona = pedido.zona || "";
                                const hasDireccion = Boolean(pedido.datosEntrega?.direccion || pedido.direccion);
                                const mapsUrl = hasDireccion ? buildMapsUrl(direccion) : "";

                                return (
                                    <div key={pedidoId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-semibold text-slate-900">{clienteNombre}</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getEstadoColor(estado)}`}>
                                                        {getEstadoLabel(estado)}
                                                    </span>
                                                    {hasIncidencia ? (
                                                        <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                                                            Incidencia
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <p className="text-sm text-slate-600 mt-2">📍 {direccion}</p>
                                                {zona ? (
                                                    <p className="text-xs text-slate-500 mt-1">Zona/Barrio: {zona}</p>
                                                ) : null}
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Pedido: <span className="font-mono">{pedidoId ? `${pedidoId.slice(0, 8)}...` : "No disponible"}</span>
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Total: {total > 0 ? formatCurrency(total) : "-"}
                                                </p>
                                                {metodoPago ? (
                                                    <p className="text-xs text-slate-500 mt-1">Pago: {metodoPago}</p>
                                                ) : null}
                                                {pedido.zona ? (
                                                    <p className="text-xs text-slate-500 mt-1">Zona: {pedido.zona}</p>
                                                ) : null}
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {pedidoId ? (
                                                    <Link
                                                        href={`/entregas/${encodeURIComponent(pedidoId)}`}
                                                        className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white text-center"
                                                    >
                                                        Ver detalle
                                                    </Link>
                                                ) : null}
                                                <button
                                                    type="button"
                                                    onClick={() => openRouteModal(pedidoId, direccion, estado)}
                                                    className="rounded-2xl border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                >
                                                    <span className="block">Ir a la ruta</span>
                                                    <span className="block text-[10px] font-normal text-slate-500">
                                                        Abre Google Maps con la dirección
                                                    </span>
                                                </button>
                                                {pedidoId && estado === "confirmado" ? (
                                                    <button
                                                        onClick={() => updateEstado(pedidoId, "asignado")}
                                                        disabled={actionLoading === pedidoId}
                                                        className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                                                    >
                                                        Aceptar
                                                    </button>
                                                ) : null}
                                                {pedidoId && estado === "asignado" ? (
                                                    <button
                                                        onClick={() => updateEstado(pedidoId, "en_bodega")}
                                                        disabled={actionLoading === pedidoId}
                                                        className="rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                                                    >
                                                        Llegué a bodega
                                                    </button>
                                                ) : null}
                                                {pedidoId && estado === "en_bodega" ? (
                                                    <button
                                                        onClick={() => updateEstado(pedidoId, "recogido")}
                                                        disabled={actionLoading === pedidoId}
                                                        className="rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                                                    >
                                                        Recogido
                                                    </button>
                                                ) : null}
                                                {pedidoId && estado === "recogido" ? (
                                                    <button
                                                        onClick={() => updateEstado(pedidoId, "en_ruta")}
                                                        disabled={actionLoading === pedidoId}
                                                        className="rounded-full bg-orange-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                                                    >
                                                        Iniciar ruta
                                                    </button>
                                                ) : null}
                                                {pedidoId && estado === "en_ruta" ? (
                                                    <button
                                                        onClick={() => updateEstado(pedidoId, "entregado")}
                                                        disabled={actionLoading === pedidoId}
                                                        className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                                                    >
                                                        Entregado
                                                    </button>
                                                ) : null}
                                                {pedidoId && estado !== "entregado" && estado !== "cancelado" ? (
                                                    <button
                                                        onClick={() => updateEstado(pedidoId, "cancelado")}
                                                        disabled={actionLoading === pedidoId}
                                                        className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                                                    >
                                                        Cancelar
                                                    </button>
                                                ) : null}
                                                {pedidoId && estado !== "entregado" && estado !== "cancelado" ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => openProblem(pedidoId, estado)}
                                                        className="rounded-full border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                                                    >
                                                        Problema
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            <Modal
                isOpen={problemOpen}
                title="Reportar problema"
                onClose={() => setProblemOpen(false)}
                onConfirm={submitProblem}
                confirmText="Registrar"
                confirmDisabled={actionLoading !== null}
            >
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700">
                        Motivo
                        <select
                            value={problemReason}
                            onChange={(e) => setProblemReason(e.target.value)}
                            className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                        >
                            <option value="cliente_no_responde">Cliente no responde</option>
                            <option value="direccion_incorrecta">Dirección incorrecta</option>
                            <option value="pedido_incompleto">Pedido incompleto</option>
                            <option value="problema_pago">Problema con el pago</option>
                            <option value="otro">Otro</option>
                        </select>
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                        Detalle (opcional)
                        <textarea
                            value={problemDetail}
                            onChange={(e) => setProblemDetail(e.target.value)}
                            rows={3}
                            className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Describe brevemente el problema"
                        />
                    </label>
                    {problemStatus ? (
                        <p className="text-xs text-amber-700">{problemStatus}</p>
                    ) : null}
                </div>
            </Modal>
            <Modal
                isOpen={routeOpen}
                title="Abrir navegación"
                onClose={() => setRouteOpen(false)}
                cancelText="Cerrar"
            >
                <div className="space-y-3 text-sm text-slate-700">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pedido</p>
                        <p className="font-mono text-xs text-slate-600">{routePedidoId || "-"}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Dirección</p>
                        <p className="font-semibold text-slate-900">
                            {routeAddress || "Dirección no disponible"}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={handleCopyAddress}
                            disabled={!routeAddress}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                        >
                            Copiar dirección
                        </button>
                        {copyStatus ? (
                            <span className="text-xs text-slate-500">{copyStatus}</span>
                        ) : null}
                    </div>
                    {routeAddress ? (
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => {
                                    window.open(buildMapsUrl(routeAddress), "_blank", "noopener,noreferrer");
                                    setRouteOpen(false);
                                }}
                                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
                            >
                                Abrir en Google Maps
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    window.open(buildWazeUrl(routeAddress), "_blank", "noopener,noreferrer");
                                    setRouteOpen(false);
                                }}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Abrir Waze
                            </button>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                            Dirección no disponible. Por favor reporta el problema.
                            <div className="mt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (routePedidoId && routeEstado) {
                                            setRouteOpen(false);
                                            openProblem(routePedidoId, routeEstado);
                                        }
                                    }}
                                    disabled={!routePedidoId || !routeEstado}
                                    className="rounded-full border border-amber-300 px-3 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:text-amber-300"
                                >
                                    Reportar problema
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}