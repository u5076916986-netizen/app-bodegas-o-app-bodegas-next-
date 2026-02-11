"use client";

import { useEffect, useMemo, useState } from "react";

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
    productoId?: string;
    nombre?: string;
    sku?: string;
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

export default function SeguimientoRecommendations({
    bodegaId,
    items,
}: {
    bodegaId: string;
    items: PedidoItem[];
}) {
    const [productos, setProductos] = useState<ProductoApi[]>([]);
    const [promos, setPromos] = useState<PromoRule[]>([]);
    const [faltantesPrevios, setFaltantesPrevios] = useState<ProductoApi[]>([]);

    useEffect(() => {
        if (!bodegaId) return;
        const load = async () => {
            try {
                const [prodRes, promoRes] = await Promise.all([
                    fetch(`/api/productos?bodegaId=${encodeURIComponent(bodegaId)}`),
                    fetch("/data/promociones.json", { cache: "no-store" }),
                ]);

                if (prodRes.ok) {
                    const data = await prodRes.json();
                    setProductos(data?.data ?? []);
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

    const hasRecommendations = lowStock.length > 0 || faltantesPrevios.length > 0 || promoProducts.length > 0;

    if (!hasRecommendations) return null;

    return (
        <details className="rounded-xl border border-[color:var(--surface-border)] bg-white p-5 shadow-sm">
            <summary className="cursor-pointer text-sm font-semibold text-[color:var(--text-strong)]">
                Recomendado para tu tienda
            </summary>
            <p className="mt-2 text-xs text-[color:var(--text-muted)]">
                Sugerencias suaves basadas en stock bajo, faltantes y promos activas.
            </p>

            {faltantesPrevios.length > 0 ? (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <h4 className="text-xs font-semibold text-amber-900">Faltantes del pedido anterior</h4>
                    <div className="mt-2 grid gap-2">
                        {faltantesPrevios.map((prod) => (
                            <div key={prod.id} className="rounded-lg bg-white p-2 text-xs">
                                <p className="font-semibold text-slate-900">{prod.nombre}</p>
                                <p className="text-slate-500">{formatCurrency(prod.precio)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {lowStock.length > 0 ? (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <h4 className="text-xs font-semibold text-slate-900">Stock bajo</h4>
                    <div className="mt-2 grid gap-2">
                        {lowStock.map((prod) => (
                            <div key={prod.id} className="rounded-lg bg-white p-2 text-xs">
                                <p className="font-semibold text-slate-900">{prod.nombre}</p>
                                <p className="text-slate-500">
                                    Stock: {prod.stock} · {formatCurrency(prod.precio)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {promoProducts.length > 0 ? (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <h4 className="text-xs font-semibold text-emerald-900">Promos activas</h4>
                    <div className="mt-2 grid gap-2">
                        {promoProducts.map((prod) => (
                            <div key={prod.id} className="rounded-lg bg-white p-2 text-xs">
                                <p className="font-semibold text-slate-900">{prod.nombre}</p>
                                <p className="text-slate-500">{formatCurrency(prod.precio)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </details>
    );
}
