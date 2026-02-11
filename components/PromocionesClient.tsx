"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/components/Modal";
import { useSearchParams } from "next/navigation";

interface Producto {
    id: string;
    nombre: string;
    categoria: string;
    precio: number;
    activo: boolean;
}

interface Promocion {
    id: string;
    bodegaId: string;
    nombre: string;
    tipo: "porcentaje" | "precio_fijo";
    valor: number;
    fechaInicio: string;
    fechaFin: string;
    aplicaA: "categoria" | "productos";
    categoriaProductos?: string[];
    productosIds?: string[];
    estado?: "activa" | "programada" | "finalizada";
    productosAfectados?: number;
    createdAt?: string;
    updatedAt?: string;
    activo?: boolean;
}

interface PromocionFormValues {
    nombre: string;
    tipo: "porcentaje" | "precio_fijo";
    valor: number;
    fechaInicio: string;
    fechaFin: string;
    aplicaA: "categoria" | "productos";
    categoriaProductos: string[];
    productosIds: string[];
    activo: boolean;
}

type ModalView = "form" | null;
type TabType = "activas" | "programadas" | "finalizadas";

interface PromocionesClientProps {
    bodegaId: string;
}

type PromoDraft = {
    nombre: string;
    tipo: "porcentaje" | "precio_fijo";
    valor: number;
    aplicaA: "categoria" | "productos";
    categoriaProductos: string[];
    fechaInicio: string;
    fechaFin: string;
    minSubtotal: number;
};

export default function PromocionesClient({ bodegaId }: PromocionesClientProps) {
    const [promociones, setPromociones] = useState<Promocion[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [modalView, setModalView] = useState<ModalView>(null);
    const [activeTab, setActiveTab] = useState<TabType>("activas");
    const [editingPromo, setEditingPromo] = useState<Promocion | null>(null);
    const [fotoPromos, setFotoPromos] = useState<PromoDraft[]>([]);
    const [fotoLoading, setFotoLoading] = useState(false);
    const [fotoError, setFotoError] = useState<string | null>(null);
    const [fotoImageUrl, setFotoImageUrl] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const autoOpenedRef = useRef(false);
    const filterAppliedRef = useRef(false);

    useEffect(() => {
        if (autoOpenedRef.current) return;
        if (searchParams.get("nueva") === "1") {
            autoOpenedRef.current = true;
            setEditingPromo(null);
            setModalView("form");
        }
    }, [searchParams]);

    useEffect(() => {
        if (filterAppliedRef.current) return;
        const statusParam = searchParams.get("status");
        if (statusParam && ["activas", "programadas", "finalizadas"].includes(statusParam)) {
            setActiveTab(statusParam as TabType);
            filterAppliedRef.current = true;
        }
    }, [searchParams]);

    // Cargar productos
    const loadProductos = useCallback(async () => {
        if (!bodegaId) return;
        try {
            const response = await fetch(`/api/productos?bodegaId=${bodegaId}`);
            const result = await response.json();
            if (result.ok) {
                setProductos(result.data || []);
            }
        } catch (err) {
            console.error("Error cargando productos:", err);
        }
    }, [bodegaId]);

    // Cargar promociones
    const loadPromociones = useCallback(async () => {
        if (!bodegaId) {
            setError("Falta el ID de la bodega");
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const response = await fetch(`/api/promociones?bodegaId=${bodegaId}`);
            const result = await response.json();
            if (result.ok) {
                setPromociones(result.data);
                setError(null);
            } else {
                setError(result.error || "Error cargando promociones");
            }
        } catch (err) {
            setError("Error cargando promociones");
        } finally {
            setLoading(false);
        }
    }, [bodegaId]);

    useEffect(() => {
        loadPromociones();
        loadProductos();
    }, [loadPromociones, loadProductos]);

    const handlePromoFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setFotoError(null);
            setSuccess(null);
            setFotoLoading(true);

            const formData = new FormData();
            formData.append("file", file);
            const response = await fetch(`/api/promociones/importar-foto?bodegaId=${bodegaId}`, {
                method: "POST",
                body: formData,
            });
            const result = await response.json();
            if (!response.ok || !result.ok) {
                setFotoError(result.error || "No se pudo procesar la imagen");
                setFotoPromos([]);
                setFotoImageUrl(null);
                return;
            }

            const promos = (result.promociones || []).map((promo: any) => ({
                nombre: String(promo.nombre ?? "").trim(),
                tipo: promo.tipo === "precio_fijo" ? "precio_fijo" : "porcentaje",
                valor: Number(promo.valor ?? 0),
                aplicaA: promo.aplicaA === "productos" ? "productos" : "categoria",
                categoriaProductos: Array.isArray(promo.categoriaProductos) ? promo.categoriaProductos : [],
                fechaInicio: String(promo.fechaInicio ?? new Date().toISOString()),
                fechaFin: String(promo.fechaFin ?? new Date().toISOString()),
                minSubtotal: Number(promo.minSubtotal ?? 0),
            })) as PromoDraft[];

            setFotoPromos(promos);
            setFotoImageUrl(result.imageUrl || null);
        } catch (err) {
            setFotoError("Error al subir la imagen");
        } finally {
            setFotoLoading(false);
        }
    };

    const handlePublishFotoPromos = async () => {
        if (fotoPromos.length === 0) {
            setFotoError("No hay promociones para publicar");
            return;
        }

        try {
            setFotoLoading(true);
            setFotoError(null);
            setSuccess(null);

            for (const promo of fotoPromos) {
                await fetch("/api/promociones", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        bodegaId,
                        nombre: promo.nombre,
                        tipo: promo.tipo,
                        valor: promo.valor,
                        fechaInicio: promo.fechaInicio,
                        fechaFin: promo.fechaFin,
                        aplicaA: promo.aplicaA,
                        categoriaProductos: promo.categoriaProductos,
                        productosIds: [],
                    }),
                });

                const cupCode = `PROMO-${Date.now().toString().slice(-5)}-${Math.floor(Math.random() * 90 + 10)}`;
                await fetch("/api/cupones", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        code: cupCode,
                        bodegaId,
                        type: promo.tipo === "porcentaje" ? "percent" : "fixed",
                        value: promo.valor,
                        minSubtotal: promo.minSubtotal,
                        active: true,
                        startDate: promo.fechaInicio,
                        endDate: promo.fechaFin,
                    }),
                });

                if (fotoImageUrl) {
                    await fetch("/api/anuncios", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            bodegaId,
                            titulo: promo.nombre,
                            imagenUrl: fotoImageUrl,
                            placements: ["home", "catalogo", "carrito", "confirmar"],
                            ctaTexto: "Ver cupón",
                            ctaHref: `/bodegas/${bodegaId}/cupones`,
                        }),
                    });
                }

                await fetch("/api/notificaciones", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        bodegaId,
                        titulo: "Nueva promoción disponible",
                        mensaje: `${promo.nombre} • ${promo.tipo === "porcentaje" ? `${promo.valor}%` : `$${promo.valor.toLocaleString("es-CO")}`} de descuento`,
                        target: "tenderos",
                    }),
                });
            }

            setSuccess("Promociones publicadas correctamente");
            setFotoPromos([]);
            setFotoImageUrl(null);
            await loadPromociones();
        } catch (err) {
            setFotoError("Error publicando promociones");
        } finally {
            setFotoLoading(false);
        }
    };

    // Calcular estado y productos afectados
    const processedPromociones = useMemo(() => {
        const now = new Date();
        return promociones.map((p) => {
            const start = new Date(p.fechaInicio);
            const end = new Date(p.fechaFin);
            let estado: "activa" | "programada" | "finalizada" = "finalizada";
            if (now < start) {
                estado = "programada";
            } else if (now >= start && now <= end && (p.activo !== false)) {
                estado = "activa";
            }

            let productosAfectados = 0;
            if (p.aplicaA === "categoria" && p.categoriaProductos) {
                productosAfectados = productos.filter((prod) =>
                    p.categoriaProductos?.includes(prod.categoria)
                ).length;
            } else if (p.aplicaA === "productos" && p.productosIds) {
                productosAfectados = p.productosIds.length;
            }

            return {
                ...p,
                estado,
                productosAfectados,
            };
        });
    }, [promociones, productos]);

    // Filtrar por tab
    const filtered = useMemo(() => {
        return processedPromociones.filter((p) => (p.estado as TabType) === activeTab);
    }, [processedPromociones, activeTab]);

    // Stats
    const stats = useMemo(() => {
        return {
            total: processedPromociones.length,
            activas: processedPromociones.filter((p) => p.estado === "activa").length,
            programadas: processedPromociones.filter((p) => p.estado === "programada").length,
            finalizadas: processedPromociones.filter((p) => p.estado === "finalizada").length,
        };
    }, [processedPromociones]);

    const handleCreate = () => {
        setEditingPromo(null);
        setModalView("form");
    };

    const handleEdit = (promo: Promocion) => {
        setEditingPromo(promo);
        setModalView("form");
    };

    const handleDelete = async (promoId: string) => {
        if (!confirm("¿Eliminar esta promoción?")) return;
        try {
            const response = await fetch(`/api/promociones/${promoId}`, {
                method: "DELETE",
            });
            const result = await response.json();
            if (result.ok) {
                await loadPromociones();
            } else {
                setError(result.error || "Error eliminando promoción");
            }
        } catch (err) {
            setError("Error eliminando promoción");
        }
    };

    const handleToggle = async (promo: Promocion) => {
        try {
            const updated = { ...promo, activo: !promo.activo };
            const response = await fetch(`/api/promociones/${promo.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updated),
            });
            const result = await response.json();
            if (result.ok) {
                await loadPromociones();
            } else {
                setError(result.error || "Error actualizando promoción");
            }
        } catch (err) {
            setError("Error actualizando promoción");
        }
    };

    const estadoColor = (estado?: string) => {
        switch (estado) {
            case "activa":
                return "bg-green-100 text-green-700 border-green-300";
            case "programada":
                return "bg-blue-100 text-blue-700 border-blue-300";
            case "finalizada":
                return "bg-slate-100 text-slate-700 border-slate-300";
            default:
                return "bg-slate-100 text-slate-700 border-slate-300";
        }
    };

    const estadoLabel = (estado?: string) => {
        switch (estado) {
            case "activa":
                return "Activa";
            case "programada":
                return "Programada";
            case "finalizada":
                return "Finalizada";
            default:
                return "Desconocida";
        }
    };

    const getCategorias = () => {
        const set = new Set(productos.map((p) => p.categoria).filter(Boolean));
        return Array.from(set).sort();
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-700">
                    {success}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Promociones</h1>
                    <p className="text-sm text-slate-600">
                        {loading ? "Cargando..." : `${stats.total} promociones totales`}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handlePromoFotoUpload}
                            aria-label="Subir foto de promoción"
                            className="hidden"
                        />
                        📷 Subir foto
                    </label>
                    {fotoLoading ? (
                        <span className="text-xs text-slate-500">Procesando...</span>
                    ) : null}
                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={loading}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        Nueva promoción
                    </button>
                </div>
            </div>

            {fotoError ? (
                <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-700">{fotoError}</div>
            ) : null}

            {fotoPromos.length > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Revisión de promociones</h2>
                            <p className="text-xs text-slate-500">Edita antes de publicar.</p>
                        </div>
                        <button
                            type="button"
                            onClick={handlePublishFotoPromos}
                            disabled={fotoLoading}
                            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:bg-slate-300"
                        >
                            {fotoLoading ? "Publicando..." : "Publicar promoción"}
                        </button>
                    </div>

                    <div className="space-y-3">
                        {fotoPromos.map((promo, idx) => (
                            <div
                                key={`${promo.nombre}-${idx}`}
                                className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[2fr_1fr_1fr_1fr]"
                            >
                                <input
                                    value={promo.nombre}
                                    onChange={(e) => {
                                        const next = [...fotoPromos];
                                        next[idx] = { ...next[idx], nombre: e.target.value };
                                        setFotoPromos(next);
                                    }}
                                    aria-label="Nombre de la promoción"
                                    placeholder="Nombre"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                                />
                                <select
                                    value={promo.tipo}
                                    onChange={(e) => {
                                        const next = [...fotoPromos];
                                        next[idx] = { ...next[idx], tipo: e.target.value as PromoDraft["tipo"] };
                                        setFotoPromos(next);
                                    }}
                                    aria-label="Tipo de promoción"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                                >
                                    <option value="porcentaje">% off</option>
                                    <option value="precio_fijo">Precio fijo</option>
                                </select>
                                <input
                                    type="number"
                                    value={promo.valor}
                                    onChange={(e) => {
                                        const next = [...fotoPromos];
                                        next[idx] = { ...next[idx], valor: Number(e.target.value) };
                                        setFotoPromos(next);
                                    }}
                                    aria-label="Valor de la promoción"
                                    placeholder="Valor"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                                />
                                <input
                                    type="number"
                                    value={promo.minSubtotal}
                                    onChange={(e) => {
                                        const next = [...fotoPromos];
                                        next[idx] = { ...next[idx], minSubtotal: Number(e.target.value) };
                                        setFotoPromos(next);
                                    }}
                                    aria-label="Mínimo de compra"
                                    placeholder="Mínimo"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-slate-200 p-4 bg-white">
                    <p className="text-sm font-medium text-slate-600">Total</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="rounded-lg border border-green-200 p-4 bg-green-50">
                    <p className="text-sm font-medium text-green-700">Activas</p>
                    <p className="text-3xl font-bold text-green-900">{stats.activas}</p>
                </div>
                <div className="rounded-lg border border-blue-200 p-4 bg-blue-50">
                    <p className="text-sm font-medium text-blue-700">Programadas</p>
                    <p className="text-3xl font-bold text-blue-900">{stats.programadas}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                    <p className="text-sm font-medium text-slate-600">Finalizadas</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.finalizadas}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="flex space-x-8" aria-label="Tabs">
                    {(["activas", "programadas", "finalizadas"] as TabType[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                                }`}
                            aria-current={activeTab === tab ? "page" : undefined}
                        >
                            {tab === "activas"
                                ? `Activas (${stats.activas})`
                                : tab === "programadas"
                                    ? `Programadas (${stats.programadas})`
                                    : `Finalizadas (${stats.finalizadas})`}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Promociones Table */}
            {loading ? (
                <div className="text-center py-8 text-slate-600">Cargando promociones...</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 rounded-lg border-2 border-dashed border-slate-300">
                    <p className="text-slate-600">
                        No hay promociones {activeTab === "activas" ? "activas" : activeTab === "programadas" ? "programadas" : "finalizadas"}
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                                    Nombre
                                </th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                                    Valor
                                </th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                                    Fechas
                                </th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                                    Productos
                                </th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((promo) => (
                                <tr key={promo.id} className="border-b border-slate-200 hover:bg-slate-50">
                                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                                        {promo.nombre}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {promo.tipo === "porcentaje" ? "%" : "$"}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                                        {promo.tipo === "porcentaje"
                                            ? `${promo.valor}%`
                                            : `$${promo.valor.toLocaleString("es-CO")}`}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {new Date(promo.fechaInicio).toLocaleDateString("es-CO")} -{" "}
                                        {new Date(promo.fechaFin).toLocaleDateString("es-CO")}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {promo.productosAfectados || 0}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${estadoColor(
                                                promo.estado
                                            )}`}
                                        >
                                            {estadoLabel(promo.estado)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(promo)}
                                                className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100"
                                                aria-label={`Editar ${promo.nombre}`}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleToggle(promo)}
                                                className={`inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded ${promo.activo !== false
                                                    ? "text-amber-700 bg-amber-50 hover:bg-amber-100"
                                                    : "text-green-700 bg-green-50 hover:bg-green-100"
                                                    }`}
                                                aria-label={
                                                    promo.activo !== false
                                                        ? `Pausar ${promo.nombre}`
                                                        : `Activar ${promo.nombre}`
                                                }
                                            >
                                                {promo.activo !== false ? "Pausar" : "Activar"}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(promo.id)}
                                                className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100"
                                                aria-label={`Eliminar ${promo.nombre}`}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={modalView === "form"}
                title={editingPromo ? `Editar: ${editingPromo.nombre}` : "Nueva promoción"}
                onClose={() => {
                    setModalView(null);
                    setEditingPromo(null);
                }}
                size="lg"
            >
                <PromocionForm
                    bodegaId={bodegaId}
                    initialPromo={editingPromo}
                    productos={productos}
                    categorias={getCategorias()}
                    onSubmit={async (values) => {
                        try {
                            const url = editingPromo
                                ? `/api/promociones/${editingPromo.id}`
                                : "/api/promociones";
                            const method = editingPromo ? "PUT" : "POST";

                            const response = await fetch(url, {
                                method,
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    bodegaId,
                                    ...values,
                                }),
                            });

                            const result = await response.json();
                            if (result.ok) {
                                setModalView(null);
                                setEditingPromo(null);
                                await loadPromociones();
                            } else {
                                setError(result.error || "Error guardando promoción");
                            }
                        } catch (err) {
                            setError("Error guardando promoción");
                        }
                    }}
                    onCancel={() => {
                        setModalView(null);
                        setEditingPromo(null);
                    }}
                />
            </Modal>
        </div>
    );
}

function PromocionForm({
    bodegaId,
    initialPromo,
    productos,
    categorias,
    onSubmit,
    onCancel,
}: {
    bodegaId: string;
    initialPromo?: Promocion | null;
    productos: Producto[];
    categorias: string[];
    onSubmit: (values: PromocionFormValues) => Promise<void>;
    onCancel: () => void;
}) {
    const [values, setValues] = useState<PromocionFormValues>(() => {
        if (initialPromo) {
            return {
                nombre: initialPromo.nombre,
                tipo: initialPromo.tipo,
                valor: initialPromo.valor,
                fechaInicio: initialPromo.fechaInicio.split("T")[0],
                fechaFin: initialPromo.fechaFin.split("T")[0],
                aplicaA: initialPromo.aplicaA,
                categoriaProductos: initialPromo.categoriaProductos || [],
                productosIds: initialPromo.productosIds || [],
                activo: initialPromo.activo !== false,
            };
        }
        return {
            nombre: "",
            tipo: "porcentaje",
            valor: 0,
            fechaInicio: new Date().toISOString().split("T")[0],
            fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
            aplicaA: "categoria",
            categoriaProductos: [],
            productosIds: [],
            activo: true,
        };
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validación
        if (!values.nombre.trim()) {
            setError("El nombre es requerido");
            return;
        }
        if (values.valor <= 0) {
            setError("El valor debe ser mayor a 0");
            return;
        }
        if (new Date(values.fechaInicio) > new Date(values.fechaFin)) {
            setError("La fecha inicio debe ser menor a la fecha fin");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await onSubmit(values);
        } catch (err) {
            setError("Error al guardar la promoción");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="promo-nombre" className="block text-sm font-medium text-slate-700">
                    Nombre
                </label>
                <input
                    id="promo-nombre"
                    type="text"
                    value={values.nombre}
                    onChange={(e) => setValues({ ...values, nombre: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Ej: Descuento de Verano"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="promo-tipo" className="block text-sm font-medium text-slate-700">
                        Tipo
                    </label>
                    <select
                        id="promo-tipo"
                        value={values.tipo}
                        onChange={(e) =>
                            setValues({
                                ...values,
                                tipo: e.target.value as "porcentaje" | "precio_fijo",
                            })
                        }
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    >
                        <option value="porcentaje">Porcentaje (%)</option>
                        <option value="precio_fijo">Precio fijo ($)</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="promo-valor" className="block text-sm font-medium text-slate-700">
                        Valor
                    </label>
                    <input
                        id="promo-valor"
                        type="number"
                        value={values.valor}
                        onChange={(e) => setValues({ ...values, valor: Number(e.target.value) })}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        placeholder="0"
                        required
                        min="0.01"
                        step="0.01"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="promo-inicio" className="block text-sm font-medium text-slate-700">
                        Fecha inicio
                    </label>
                    <input
                        id="promo-inicio"
                        type="date"
                        value={values.fechaInicio}
                        onChange={(e) => setValues({ ...values, fechaInicio: e.target.value })}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="promo-fin" className="block text-sm font-medium text-slate-700">
                        Fecha fin
                    </label>
                    <input
                        id="promo-fin"
                        type="date"
                        value={values.fechaFin}
                        onChange={(e) => setValues({ ...values, fechaFin: e.target.value })}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        required
                    />
                </div>
            </div>

            <div>
                <label htmlFor="promo-aplica" className="block text-sm font-medium text-slate-700">
                    Aplica a
                </label>
                <select
                    id="promo-aplica"
                    value={values.aplicaA}
                    onChange={(e) => {
                        const newAplica = e.target.value as "categoria" | "productos";
                        setValues({
                            ...values,
                            aplicaA: newAplica,
                            categoriaProductos: newAplica === "categoria" ? values.categoriaProductos : [],
                            productosIds: newAplica === "productos" ? values.productosIds : [],
                        });
                    }}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                    <option value="categoria">Categoría de productos</option>
                    <option value="productos">Productos específicos</option>
                </select>
            </div>

            {values.aplicaA === "categoria" && (
                <div>
                    <label htmlFor="promo-categorias" className="block text-sm font-medium text-slate-700">
                        Categorías
                    </label>
                    <select
                        id="promo-categorias"
                        multiple
                        value={values.categoriaProductos}
                        onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                            setValues({ ...values, categoriaProductos: selected });
                        }}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        size={Math.min(categorias.length, 5)}
                    >
                        {categorias.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-500">Selecciona una o más categorías (Ctrl+Click)</p>
                </div>
            )}

            {values.aplicaA === "productos" && (
                <div>
                    <label htmlFor="promo-productos" className="block text-sm font-medium text-slate-700">
                        Productos
                    </label>
                    <select
                        id="promo-productos"
                        multiple
                        value={values.productosIds}
                        onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                            setValues({ ...values, productosIds: selected });
                        }}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        size={Math.min(productos.length, 5)}
                    >
                        {productos.map((prod) => (
                            <option key={prod.id} value={prod.id}>
                                {prod.nombre}
                            </option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-500">Selecciona uno o más productos (Ctrl+Click)</p>
                </div>
            )}

            <div>
                <label htmlFor="promo-activo" className="flex items-center gap-2">
                    <input
                        id="promo-activo"
                        type="checkbox"
                        checked={values.activo}
                        onChange={(e) => setValues({ ...values, activo: e.target.checked })}
                        className="rounded border-slate-300"
                    />
                    <span className="text-sm font-medium text-slate-700">Promoción activa</span>
                </label>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-200">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? "Guardando..." : initialPromo ? "Actualizar" : "Crear"}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
}
