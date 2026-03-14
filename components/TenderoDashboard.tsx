"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Bodega } from "@/lib/csv";
import type { BodegaTheme } from "@/lib/themes";

type Props = {
    bodegas: Bodega[];
    themes: Record<string, BodegaTheme>;
    fallbackTheme: BodegaTheme;
};

const CATEGORIAS_ICONOS: Record<string, string> = {
    ABARROTES: "🛒",
    BEBIDAS: "🥤",
    ASEO: "🧹",
    GRANOS: "🌾",
    LACTEOS: "🥛",
    PANADERIA: "🍞",
    CARNES: "🥩",
    FRUTAS: "🍎",
    SNACKS: "🍟",
    LICORES: "🍺",
    GENERAL: "🏪",
    MIXTA: "🏬",
};

const getIconForCategoria = (cat: string) => {
    const key = Object.keys(CATEGORIAS_ICONOS).find((k) =>
        cat?.toUpperCase().includes(k),
    );
    return key ? CATEGORIAS_ICONOS[key] : "🏪";
};

const formatCOP = (value: number | null) => {
    if (!value) return "N/D";
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(value);
};

const normalize = (v: string) =>
    v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default function TenderoDashboard({ bodegas, themes, fallbackTheme }: Props) {
    const [busqueda, setBusqueda] = useState("");
    const [categoriaActiva, setCategoriaActiva] = useState("Todas");

    const categorias = useMemo(() => {
        const set = new Set(bodegas.map((b) => b.categoria_principal).filter(Boolean));
        return ["Todas", ...Array.from(set).sort()];
    }, [bodegas]);

    const activas = useMemo(
        () => bodegas.filter((b) => b.estado?.toLowerCase() === "activo"),
        [bodegas],
    );

    const filtradas = useMemo(() => {
        let result = activas;
        if (categoriaActiva !== "Todas") {
            result = result.filter((b) => b.categoria_principal === categoriaActiva);
        }
        if (busqueda.trim()) {
            const q = normalize(busqueda);
            result = result.filter((b) =>
                [b.nombre, b.categoria_principal, b.zona, b.ciudad].some((f) =>
                    normalize(f || "").includes(q),
                ),
            );
        }
        return result;
    }, [activas, categoriaActiva, busqueda]);

    return (
        <div className="w-full space-y-5 pb-24">
            {/* Hero Search */}
            <div className="relative rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 p-5 text-white shadow-md">
                <p className="text-xs font-semibold uppercase tracking-widest opacity-80">
                    Bienvenido
                </p>
                <h1 className="mt-1 text-2xl font-bold">
                    ¿Qué necesitas hoy?
                </h1>
                <div className="mt-3 relative">
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar bodega, producto, zona..."
                        className="w-full rounded-xl border-0 bg-white/95 py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 shadow focus:outline-none focus:ring-2 focus:ring-white"
                    />
                    <svg
                        className="absolute left-3 top-3.5 h-4 w-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                        />
                    </svg>
                    {busqueda && (
                        <button
                            onClick={() => setBusqueda("")}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Accesos rápidos */}
            <div className="grid grid-cols-4 gap-2">
                {[
                    { label: "Mis pedidos", href: "/pedidos", icon: "📦" },
                    { label: "Carrito", href: "/tendero/checkout", icon: "🛒" },
                    { label: "Cupones", href: "/tendero/cupones", icon: "🎟️" },
                    { label: "Asistente IA", href: "/tendero/ia", icon: "🤖" },
                ].map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-100 bg-white p-3 shadow-sm hover:border-sky-200 hover:shadow-md transition"
                    >
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-[10px] font-medium text-slate-600 text-center leading-tight">
                            {item.label}
                        </span>
                    </Link>
                ))}
            </div>

            {/* Categorías chips */}
            <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Categorías
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {categorias.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategoriaActiva(cat)}
                            className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                categoriaActiva === cat
                                    ? "bg-sky-500 text-white shadow"
                                    : "bg-white border border-slate-200 text-slate-600 hover:border-sky-300"
                            }`}
                        >
                            {cat !== "Todas" && (
                                <span>{getIconForCategoria(cat)}</span>
                            )}
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Resultado */}
            <div>
                <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">
                        {filtradas.length} bodega{filtradas.length !== 1 ? "s" : ""}
                        {categoriaActiva !== "Todas" ? ` en ${categoriaActiva}` : ""}
                    </p>
                    {(busqueda || categoriaActiva !== "Todas") && (
                        <button
                            onClick={() => {
                                setBusqueda("");
                                setCategoriaActiva("Todas");
                            }}
                            className="text-xs text-sky-600 hover:underline"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>

                {filtradas.length === 0 ? (
                    <div className="rounded-xl bg-slate-50 p-8 text-center">
                        <p className="text-4xl mb-2">🔍</p>
                        <p className="text-sm text-slate-500">
                            No hay bodegas con esos filtros.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {filtradas.map((bodega) => {
                            const theme = themes[bodega.bodega_id] ?? fallbackTheme;
                            const icono = getIconForCategoria(bodega.categoria_principal);
                            return (
                                <Link
                                    key={bodega.bodega_id}
                                    href={`/bodegas/${bodega.bodega_id}`}
                                    className="group block overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-sky-200 transition"
                                >
                                    {/* Banner color */}
                                    <div
                                        className="flex h-20 items-center justify-between px-5"
                                        style={{
                                            background: `linear-gradient(135deg, ${theme.primary || "#0ea5e9"}, ${theme.accent || "#10b981"})`,
                                        }}
                                    >
                                        <span className="text-4xl">{icono}</span>
                                        <div className="text-right">
                                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                                                {bodega.estado}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-4">
                                        <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition truncate">
                                            {bodega.nombre}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                                            {bodega.ciudad} • {bodega.zona}
                                        </p>

                                        <div className="mt-3 flex items-center gap-3 text-xs">
                                            <div className="flex items-center gap-1">
                                                <span>🕐</span>
                                                <span className="font-medium text-slate-700">
                                                    {bodega.tiempo_entrega_estimado || "N/D"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span>💰</span>
                                                <span className="font-medium text-slate-700">
                                                    Min {formatCOP(bodega.min_pedido_cop)}
                                                </span>
                                            </div>
                                        </div>

                                        {bodega.metodos_pago && (
                                            <p className="mt-2 text-[10px] text-slate-400 truncate">
                                                💳 {bodega.metodos_pago}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
