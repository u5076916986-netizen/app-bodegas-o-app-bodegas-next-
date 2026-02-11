"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Producto = any;
type BodegaOpt = { id: string; nombre: string; zona: string };

export default function BuscarClient({
    initialQuery = "",
    initialCategory = undefined,
    initialBodega = undefined,
    initialZona = undefined,
    initialMinPrice = undefined,
    initialMaxPrice = undefined,
    initialSort = undefined,
    categorias = [],
    bodegas = [],
    zonas = [],
}: {
    initialQuery?: string;
    initialCategory?: string | undefined;
    initialBodega?: string | undefined;
    initialZona?: string | undefined;
    initialMinPrice?: string | undefined;
    initialMaxPrice?: string | undefined;
    initialSort?: string | undefined;
    categorias: string[];
    bodegas: BodegaOpt[];
    zonas: string[];
}) {
    const [q, setQ] = useState(initialQuery);
    const [categoria, setCategoria] = useState("");
    const [bodegaId, setBodegaId] = useState("");
    const [zona, setZona] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [sort, setSort] = useState<string>("relevancia");
    const router = useRouter();
    const [results, setResults] = useState<any[]>([]);
    const [facets, setFacets] = useState<any>({ categorias: [], bodegas: [], zonas: [] });
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [didYouMean, setDidYouMean] = useState<string[]>([]);

    const performSearch = async (query: string, opts?: any) => {
        if (!query || query.trim().length < 2) {
            setResults([]);
            setTotal(0);
            setDidYouMean([]);
            return;
        }
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("q", query);
            if (opts?.categoria) params.set("category", opts.categoria);
            if (opts?.bodegaId) params.set("bodegaId", opts.bodegaId);
            if (opts?.zona) params.set("zona", opts.zona);
            if (opts?.minPrice) params.set("minPrice", String(opts.minPrice));
            if (opts?.maxPrice) params.set("maxPrice", String(opts.maxPrice));
            params.set("sort", opts?.sort || "relevancia");
            const res = await fetch(`/api/buscar?${params.toString()}`);
            if (!res.ok) throw new Error("Error en búsqueda");
            const data = await res.json();
            if (data.ok) {
                setResults(data.items || []);
                setFacets(data.facets || {});
                setTotal(data.total || 0);
                setDidYouMean(data.meta?.didYouMean || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // debounce 300ms using timeout
    const timerRef = useRef<number | null>(null);
    useEffect(() => {
        if (!q || q.trim().length < 2) {
            setResults([]);
            setTotal(0);
            return;
        }
        const opts = { categoria, bodegaId, zona, minPrice: minPrice ? Number(minPrice) : undefined, maxPrice: maxPrice ? Number(maxPrice) : undefined, sort };
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
            performSearch(q, opts);
        }, 300);
        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
    }, [q, categoria, bodegaId, zona, minPrice, maxPrice, sort]);

    // initialize from initial props
    useEffect(() => {
        setQ(initialQuery ?? "");
        if (initialCategory) setCategoria(initialCategory);
        if (initialBodega) setBodegaId(initialBodega);
        if (initialZona) setZona(initialZona);
        if (initialMinPrice) setMinPrice(initialMinPrice);
        if (initialMaxPrice) setMaxPrice(initialMaxPrice);
        if (initialSort) setSort(initialSort);
    }, [initialQuery, initialCategory, initialBodega, initialZona, initialMinPrice, initialMaxPrice, initialSort]);

    // sync URL on searches


    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const highlightName = (name: string, tokens: string[] | undefined) => {
        if (!tokens || tokens.length === 0) return name;
        const pattern = tokens.map(escapeRegex).join("|");
        if (!pattern) return name;
        const re = new RegExp(`(${pattern})`, "ig");
        const parts = name.split(re);
        return parts.map((part, i) => {
            if (re.test(part)) {
                return <mark key={i}>{part}</mark>;
            }
            return <span key={i}>{part}</span>;
        });
    };


    const syncUrl = (query: string, opts: any) => {
        try {
            const params = new URLSearchParams();
            if (query) params.set("q", query);
            if (opts?.categoria) params.set("category", opts.categoria);
            if (opts?.bodegaId) params.set("bodegaId", opts.bodegaId);
            if (opts?.zona) params.set("zona", opts.zona);
            if (opts?.minPrice) params.set("minPrice", String(opts.minPrice));
            if (opts?.maxPrice) params.set("maxPrice", String(opts.maxPrice));
            if (opts?.sort) params.set("sort", opts.sort);
            router.replace(`/buscar?${params.toString()}`);
        } catch (e) {
            // ignore
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <input
                    aria-label="Buscar productos"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            const opts = { categoria, bodegaId, zona, minPrice: minPrice ? Number(minPrice) : undefined, maxPrice: maxPrice ? Number(maxPrice) : undefined, sort };
                            syncUrl(q, opts);
                            performSearch(q, opts);
                        }
                    }}
                    placeholder="Buscar productos..."
                    className="flex-1 px-3 py-2 border rounded"
                />
                <button
                    onClick={() => {
                        const opts = { categoria, bodegaId, zona, minPrice: minPrice ? Number(minPrice) : undefined, maxPrice: maxPrice ? Number(maxPrice) : undefined, sort };
                        syncUrl(q, opts);
                        performSearch(q, opts);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                    Buscar
                </button>
            </div>

            <div className="flex gap-2">
                <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="px-3 py-2 border rounded">
                    <option value="">Todas las categorías</option>
                    {categorias.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>

                <select value={bodegaId} onChange={(e) => setBodegaId(e.target.value)} className="px-3 py-2 border rounded">
                    <option value="">Todas las bodegas</option>
                    {bodegas.map((b) => (
                        <option key={b.id} value={b.id}>
                            {b.nombre}
                        </option>
                    ))}
                </select>

                <select value={zona} onChange={(e) => setZona(e.target.value)} className="px-3 py-2 border rounded">
                    <option value="">Todas las zonas</option>
                    {zonas.map((z) => (
                        <option key={z} value={z}>
                            {z}
                        </option>
                    ))}
                </select>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-3 py-2 border rounded">
                    <option value="relevancia">Relevancia</option>
                    <option value="precio_asc">Precio: menor primero</option>
                    <option value="precio_desc">Precio: mayor primero</option>
                </select>
            </div>

            <div>
                {loading ? (
                    <div className="text-sm text-gray-500">Buscando...</div>
                ) : (
                    <>
                        {didYouMean && didYouMean.length > 0 && (
                            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="text-sm font-semibold text-amber-900">
                                    ¿Quisiste decir: {" "}
                                    {didYouMean.map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setQ(suggestion);
                                                performSearch(suggestion, { categoria, bodegaId, zona, minPrice: minPrice ? Number(minPrice) : undefined, maxPrice: maxPrice ? Number(maxPrice) : undefined, sort });
                                            }}
                                            className="underline text-amber-700 hover:text-amber-900 font-bold cursor-pointer"
                                        >
                                            {suggestion}
                                        </button>
                                    )).reduce((acc, el, idx) => idx === 0 ? [el] : [...acc, ", ", el], [] as any)}
                                    ?
                                </div>
                            </div>
                        )}
                        {q.trim().length > 0 && results.length === 0 ? (
                            <div className="text-sm text-gray-500">Sin resultados</div>
                        ) : (
                            <div className="space-y-3">
                                <div className="text-sm text-gray-600">
                                    {total} resultado{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {results.map((item: any) => (
                                        <div key={item.productId} className="p-4 border rounded-lg bg-white hover:shadow-md transition">
                                            <div className="flex flex-col gap-2 h-full">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-slate-900">
                                                        {item.nombre}
                                                    </h3>
                                                    <div className="text-xs uppercase tracking-wide text-slate-500 mt-1">
                                                        {item.categoria}
                                                    </div>
                                                </div>
                                                <div className="space-y-1 text-sm text-slate-600">
                                                    <div><strong>Bodega:</strong> {item.bodegaNombre || "—"}</div>
                                                    <div><strong>Zona:</strong> {item.zona || "—"}</div>
                                                    {item.stock !== null && (
                                                        <div><strong>Stock:</strong> {item.stock}</div>
                                                    )}
                                                </div>
                                                <div className="mt-auto pt-2">
                                                    <div className="text-xl font-bold text-green-700 mb-3">
                                                        {item.precio !== null
                                                            ? item.precio.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
                                                            : "N/D"}
                                                    </div>
                                                    <Link
                                                        href={`/bodegas/${item.bodegaId}`}
                                                        className="block w-full px-3 py-2 border border-blue-600 text-blue-600 rounded text-center text-sm font-semibold hover:bg-blue-50"
                                                    >
                                                        Ver en bodega
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
