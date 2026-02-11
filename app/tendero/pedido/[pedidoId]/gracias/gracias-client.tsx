"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ProductoApi = {
    id: string;
    bodegaId: string;
    nombre: string;
    sku: string;
    categoria: string;
    precio: number;
    stock: number;
    activo: boolean;
};

type PedidoItem = {
    productoId: string;
    nombre?: string;
    sku?: string;
};

type Cupon = {
    id: string;
    code: string;
    bodegaId: string | null;
    active: boolean;
};

type PromoRule = {
    id: string;
    bodegaId: string;
    nombre: string;
    tipo: string;
    valor: number;
    fechaInicio: string;
    fechaFin: string;
    aplicaA: "categoria" | "producto" | string;
    categoriaProductos?: string[];
    productosIds?: string[];
    estado: string;
};

const formatCurrency = (value: number) =>
    value.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    });

export default function GraciasClient({
    bodegaId,
    items,
}: {
    bodegaId: string;
    items: PedidoItem[];
}) {
    const [productos, setProductos] = useState<ProductoApi[]>([]);
    const [cupones, setCupones] = useState<Cupon[]>([]);
    const [promos, setPromos] = useState<PromoRule[]>([]);
    const [faltantesPrevios, setFaltantesPrevios] = useState<ProductoApi[]>([]);

    useEffect(() => {
        if (!bodegaId) return;
        const load = async () => {
            try {
                const [prodRes, cuponRes, promoRes] = await Promise.all([
                    fetch(`/api/productos?bodegaId=${encodeURIComponent(bodegaId)}`),
                    fetch(`/api/cupones?bodegaId=${encodeURIComponent(bodegaId)}&activo=true`),
                    fetch("/data/promociones.json", { cache: "no-store" }),
                ]);

                if (prodRes.ok) {
                    const data = await prodRes.json();
                    setProductos(data?.data ?? []);
                }
                if (cuponRes.ok) {
                    const data = await cuponRes.json();
                    setCupones(data?.cupones ?? []);
                }
                if (promoRes.ok) {
                    const data = await promoRes.json();
                    const list = Array.isArray(data) ? data : [];
                    setPromos(list.filter((promo: PromoRule) => promo.bodegaId === bodegaId));
                }
            } catch (err) {
                console.error("Error cargando recomendaciones", err);
            }
        };

        load();
    }, [bodegaId]);

    useEffect(() => {
        if (!bodegaId) return;
        const key = `tendero:last-pedido-items:${bodegaId}`;
        try {
            const raw = window.localStorage.getItem(key);
            const prevItems = raw ? (JSON.parse(raw) as PedidoItem[]) : [];
            const currentSet = new Set(
                items
                    .map((item) => item.sku || item.productoId || item.nombre || "")
                    .map((value) => value.toLowerCase()),
            );
            const missing = prevItems.filter((item) => {
                const token = (item.sku || item.productoId || item.nombre || "").toLowerCase();
                return token && !currentSet.has(token);
            });
            const missingProducts = missing
                .map((miss) => {
                    const token = (miss.sku || miss.productoId || miss.nombre || "").toLowerCase();
                    return productos.find(
                        (prod) =>
                            prod.sku.toLowerCase() === token ||
                            prod.id.toLowerCase() === token ||
                            prod.nombre.toLowerCase() === token,
                    );
                })
                .filter(Boolean) as ProductoApi[];
            setFaltantesPrevios(missingProducts.slice(0, 3));
            window.localStorage.setItem(key, JSON.stringify(items));
        } catch {
            // ignore storage errors
        }
    }, [bodegaId, items, productos]);

    const lowStock = useMemo(() => {
        return [...productos]
            .filter((p) => p.activo !== false && Number(p.stock ?? 0) <= 5)
            .sort((a, b) => Number(a.stock ?? 0) - Number(b.stock ?? 0))
            .slice(0, 3);
    }, [productos]);

    const now = useMemo(() => new Date(), []);
    const activePromos = useMemo(() => {
        return promos.filter((promo) => {
            if (promo.estado !== "activa") return false;
            const start = new Date(promo.fechaInicio).getTime();
            const end = new Date(promo.fechaFin).getTime();
            const nowTime = now.getTime();
            return nowTime >= start && nowTime <= end;
        });
    }, [promos, now]);

    const promoProducts = useMemo(() => {
        if (activePromos.length === 0 || productos.length === 0) return [] as ProductoApi[];
        const ids = new Set(activePromos.flatMap((promo) => promo.productosIds || []));
        const categorias = new Set(
            activePromos.flatMap((promo) => promo.categoriaProductos || []).map((c) => c.toLowerCase()),
        );
        return productos
            .filter((prod) => {
                if (ids.size > 0 && ids.has(prod.id)) return true;
                if (categorias.size > 0 && categorias.has(prod.categoria.toLowerCase())) return true;
                return false;
            })
            .slice(0, 3);
    }, [activePromos, productos]);

    const hasCupones = cupones.some((c) => c.active);
    const hasRecommendations =
        lowStock.length > 0 || faltantesPrevios.length > 0 || promoProducts.length > 0 || hasCupones;

    return (
        <section className="mt-8 space-y-6">
            {hasRecommendations ? (
                <details className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <summary className="cursor-pointer text-lg font-semibold text-slate-900">
                        Recomendado para tu tienda
                    </summary>
                    <p className="mt-2 text-sm text-slate-600">
                        Sugerencias rápidas basadas en stock bajo, faltantes y promociones activas.
                    </p>

                    {faltantesPrevios.length > 0 ? (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <h3 className="text-sm font-semibold text-amber-900">Faltantes del pedido anterior</h3>
                            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                {faltantesPrevios.map((prod) => (
                                    <div key={prod.id} className="rounded-xl bg-white p-3 shadow-sm">
                                        <p className="text-sm font-semibold text-slate-900">{prod.nombre}</p>
                                        <p className="text-xs text-slate-500">{formatCurrency(prod.precio)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {lowStock.length > 0 ? (
                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <h3 className="text-sm font-semibold text-slate-900">Stock bajo</h3>
                            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                {lowStock.map((prod) => (
                                    <div key={prod.id} className="rounded-xl bg-white p-3 shadow-sm">
                                        <p className="text-sm font-semibold text-slate-900">{prod.nombre}</p>
                                        <p className="text-xs text-slate-500">
                                            Stock: {prod.stock} · {formatCurrency(prod.precio)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {promoProducts.length > 0 ? (
                        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                            <h3 className="text-sm font-semibold text-emerald-900">Promociones activas</h3>
                            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                {promoProducts.map((prod) => (
                                    <div key={prod.id} className="rounded-xl bg-white p-3 shadow-sm">
                                        <p className="text-sm font-semibold text-slate-900">{prod.nombre}</p>
                                        <p className="text-xs text-slate-500">{formatCurrency(prod.precio)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {hasCupones && productos.length > 0 ? (
                        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                            <h3 className="text-sm font-semibold text-emerald-900">Cupones activos</h3>
                            <p className="text-xs text-emerald-700">Aprovecha para tu próxima compra.</p>
                        </div>
                    ) : null}
                </details>
            ) : null}

            <div className="flex flex-wrap gap-2">
                <Link
                    href="/tendero"
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                    Seguir comprando
                </Link>
            </div>
        </section>
    );
}
