"use client";

import { useEffect, useState } from "react";

type ProductoShort = {
    productId: string;
    nombre: string;
    categoria?: string;
    precio?: number | null;
    bodegaId?: string | null;
    bodegaNombre?: string | null;
};

export default function useSearchSuggest(q: string) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [productos, setProductos] = useState<ProductoShort[]>([]);
    const [bodegas, setBodegas] = useState<{ id: string; nombre: string }[]>([]);
    const [categorias, setCategorias] = useState<string[]>([]);
    const [didYouMean, setDidYouMean] = useState<string[]>([]);

    useEffect(() => {
        if (!q || q.trim().length < 2) {
            setProductos([]);
            setBodegas([]);
            setCategorias([]);
            setDidYouMean([]);
            setLoading(false);
            setError(null);
            return;
        }

        const controller = new AbortController();
        setLoading(true);
        setError(null);

        const id = setTimeout(() => {
            fetch(`/api/buscar?q=${encodeURIComponent(q)}&limit=6`, { signal: controller.signal })
                .then((r) => r.json())
                .then((json) => {
                    if (!json || !json.ok) {
                        setProductos([]);
                        setBodegas([]);
                        setCategorias([]);
                        setDidYouMean([]);
                        setError(json?.error || "Error en búsqueda");
                        return;
                    }

                    const items = Array.isArray(json.items) ? json.items : [];
                    const mapped: ProductoShort[] = items.map((it: any) => ({
                        productId: it.productId,
                        nombre: it.nombre,
                        categoria: it.categoria,
                        precio: it.precio,
                        bodegaId: it.bodegaId,
                        bodegaNombre: it.bodegaNombre,
                    }));

                    setProductos(mapped.slice(0, 6));
                    setBodegas((json.facets?.bodegas ?? []).slice(0, 6));
                    setCategorias((json.facets?.categorias ?? []).slice(0, 8));
                    setDidYouMean(json.meta?.didYouMean ?? []);
                })
                .catch((err) => {
                    if (err.name === "AbortError") return;
                    setError(String(err));
                    setProductos([]);
                    setBodegas([]);
                    setCategorias([]);
                    setDidYouMean([]);
                })
                .finally(() => setLoading(false));
        }, 200);

        return () => {
            clearTimeout(id);
            controller.abort();
        };
    }, [q]);

    return { loading, error, productos, bodegas, categorias, didYouMean };
}
