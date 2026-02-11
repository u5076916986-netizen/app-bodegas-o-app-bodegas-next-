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

const formatCurrency = (value: number) =>
    value.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    });

export default function GraciasClient({
    bodegaId,
    total,
    minimoPedido,
    items,
}: {
    bodegaId: string;
    total: number;
    minimoPedido: number;
    items: PedidoItem[];
}) {
    const [productos, setProductos] = useState<ProductoApi[]>([]);
    const [cupones, setCupones] = useState<Cupon[]>([]);

    useEffect(() => {
        if (!bodegaId) return;
        const load = async () => {
            try {
                const [prodRes, cuponRes] = await Promise.all([
                    fetch(`/api/productos?bodegaId=${encodeURIComponent(bodegaId)}`),
                    fetch(`/api/cupones?bodegaId=${encodeURIComponent(bodegaId)}&activo=true`),
                ]);

                if (prodRes.ok) {
                    const data = await prodRes.json();
                    setProductos(data?.data ?? []);
                }
                if (cuponRes.ok) {
                    const data = await cuponRes.json();
                    setCupones(data?.cupones ?? []);
                }
            } catch (err) {
                console.error("Error cargando recomendaciones", err);
            }
        };

        load();
    }, [bodegaId]);

    const cheapProducts = useMemo(() => {
        return [...productos]
            .filter((p) => p.activo !== false)
            .sort((a, b) => a.precio - b.precio)
            .slice(0, 3);
    }, [productos]);

    const hasCupones = cupones.some((c) => c.active);

    const categorySuggestion = useMemo(() => {
        if (productos.length === 0) return null;
        const present = new Set(
            items
                .map((item) => item.sku || item.productoId || item.nombre || "")
                .map((value) => value.toLowerCase()),
        );

        const matchItemToCategory = (producto: ProductoApi) => {
            if (!producto) return false;
            return present.has(producto.sku.toLowerCase()) || present.has(producto.nombre.toLowerCase());
        };

        const categoryKeys = ["aseo", "bebidas", "snacks"];
        for (const key of categoryKeys) {
            const inCart = productos.some(
                (producto) => producto.categoria.toLowerCase().includes(key) && matchItemToCategory(producto),
            );
            if (!inCart) {
                return productos.find((producto) => producto.categoria.toLowerCase().includes(key)) || null;
            }
        }
        return null;
    }, [items, productos]);

    return (
        <section className="mt-8 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Recomendaciones</h2>
                <p className="text-sm text-slate-600">Ideas rápidas para tu próxima compra.</p>
            </div>

            {total < minimoPedido && cheapProducts.length > 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                    <h3 className="text-sm font-semibold text-amber-900">
                        Agrega productos para llegar al mínimo
                    </h3>
                    <p className="text-xs text-amber-700">Selecciona alguno de estos económicos:</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        {cheapProducts.map((prod) => (
                            <div key={prod.id} className="rounded-xl bg-white p-3 shadow-sm">
                                <p className="text-sm font-semibold text-slate-900">{prod.nombre}</p>
                                <p className="text-xs text-slate-500">{formatCurrency(prod.precio)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {hasCupones && productos.length > 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                    <h3 className="text-sm font-semibold text-emerald-900">
                        Cupones activos disponibles
                    </h3>
                    <p className="text-xs text-emerald-700">Aprovecha con estos productos:</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        {productos.slice(0, 3).map((prod) => (
                            <div key={prod.id} className="rounded-xl bg-white p-3 shadow-sm">
                                <p className="text-sm font-semibold text-slate-900">{prod.nombre}</p>
                                <p className="text-xs text-slate-500">{formatCurrency(prod.precio)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {categorySuggestion ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-900">Sugerencia por categoría</h3>
                    <p className="text-xs text-slate-500">Podría faltarte un básico de {categorySuggestion.categoria}.</p>
                    <div className="mt-3 rounded-xl bg-slate-50 p-3">
                        <p className="text-sm font-semibold text-slate-900">{categorySuggestion.nombre}</p>
                        <p className="text-xs text-slate-500">{formatCurrency(categorySuggestion.precio)}</p>
                    </div>
                </div>
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
