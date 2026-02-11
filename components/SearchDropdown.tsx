"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type SuggestionItem = { type: "producto" | "bodega" | "categoria"; id?: string; label: string; meta?: any };

export default function SearchDropdown({
    open,
    q,
    productos = [],
    bodegas = [],
    categorias = [],
    history = { queries: [], clicks: [] },
    trends = [],
    didYouMean = [],
    onSelect = (s: SuggestionItem) => { },
    onClearHistory = () => { },
    onClose = () => { },
}: any) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [active, setActive] = useState<number | null>(null);

    const sections = useMemo(() => {
        const items: SuggestionItem[] = [];
        if (q && q.trim().length >= 2) {
            productos.forEach((p: any) => items.push({ type: "producto", id: p.productId, label: p.nombre, meta: p }));
            bodegas.forEach((b: any) => items.push({ type: "bodega", id: b.id, label: b.nombre, meta: b }));
            categorias.forEach((c: any) => items.push({ type: "categoria", label: c }));
        } else {
            // empty query: show history + trends
            history.queries?.forEach((q: string) => items.push({ type: "categoria", label: q }));
            trends?.forEach((t: string) => items.push({ type: "categoria", label: t }));
        }
        return items;
    }, [q, productos, bodegas, categorias, history, trends]);

    useEffect(() => {
        function onDoc(e: any) {
            if (!ref.current) return;
            if (!ref.current.contains(e.target)) onClose();
        }
        if (open) document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [open, onClose]);

    useEffect(() => setActive(sections.length > 0 ? 0 : null), [q, sections.length]);

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (!sections.length) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((prev) => (prev === null ? 0 : Math.min(sections.length - 1, prev + 1)));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((prev) => (prev === null ? sections.length - 1 : Math.max(0, prev - 1)));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (active !== null) onSelect(sections[active]);
        } else if (e.key === "Escape") {
            onClose();
        }
    };

    if (!open) return null;

    return (
        <div ref={ref} onKeyDown={onKeyDown} tabIndex={0} className="absolute right-0 left-0 z-50 mt-1 rounded-b-lg border bg-white shadow-lg">
            <div className="max-h-72 overflow-auto">
                {q && q.trim().length >= 2 ? (
                    <div>
                        {productos.length === 0 && bodegas.length === 0 && categorias.length === 0 && didYouMean && didYouMean.length > 0 && (
                            <div className="p-2">
                                <div className="text-xs font-semibold text-slate-500 mb-2">¿Quisiste decir:</div>
                                {didYouMean.map((s: string, idx: number) => (
                                    <div
                                        key={`dym-${idx}`}
                                        onMouseEnter={() => setActive(idx)}
                                        onClick={() => onSelect({ type: "categoria", label: s })}
                                        className={`cursor-pointer px-3 py-2 hover:bg-amber-50 ${active === idx ? "bg-amber-50" : ""}`}
                                    >
                                        <div className="text-sm font-medium text-amber-700">{s}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {productos.length > 0 && (
                            <div className="p-2">
                                <div className="text-xs font-semibold text-slate-500">Productos</div>
                                {productos.map((p: any, i: number) => (
                                    <div
                                        key={`prod-${p.productId}-${i}`}
                                        onMouseEnter={() => setActive(i)}
                                        onClick={() => onSelect({ type: "producto", id: p.productId, label: p.nombre, meta: p })}
                                        className={`cursor-pointer px-3 py-2 hover:bg-slate-50 ${active === i ? "bg-slate-50" : ""}`}
                                    >
                                        <div className="text-sm font-medium">{p.nombre}</div>
                                        <div className="text-xs text-slate-500">{p.bodegaNombre ?? ""} · {p.categoria ?? ""}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {bodegas.length > 0 && (
                            <div className="p-2">
                                <div className="text-xs font-semibold text-slate-500">Bodegas</div>
                                {bodegas.map((b: any, j: number) => {
                                    const idx = (didYouMean?.length ?? 0) + productos.length + j;
                                    return (
                                        <div
                                            key={`b-${b.id}-${j}`}
                                            onMouseEnter={() => setActive(idx)}
                                            onClick={() => onSelect({ type: "bodega", id: b.id, label: b.nombre, meta: b })}
                                            className={`cursor-pointer px-3 py-2 hover:bg-slate-50 ${active === idx ? "bg-slate-50" : ""}`}
                                        >
                                            <div className="text-sm font-medium">{b.nombre}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {categorias.length > 0 && (
                            <div className="p-2">
                                <div className="text-xs font-semibold text-slate-500">Categorías</div>
                                {categorias.map((c: any, k: number) => {
                                    const idx = (didYouMean?.length ?? 0) + productos.length + bodegas.length + k;
                                    return (
                                        <div
                                            key={`c-${c}-${k}`}
                                            onMouseEnter={() => setActive(idx)}
                                            onClick={() => onSelect({ type: "categoria", label: c })}
                                            className={`cursor-pointer px-3 py-2 hover:bg-slate-50 ${active === idx ? "bg-slate-50" : ""}`}
                                        >
                                            <div className="text-sm">{c}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-2">
                        <div className="flex items-center justify-between">
                            <div className="text-xs font-semibold text-slate-500">Historial reciente</div>
                            <button onClick={onClearHistory} className="text-xs text-red-600 underline">Borrar historial</button>
                        </div>
                        <div className="mt-2">
                            {history.queries?.map((q: string, i: number) => (
                                <div key={`h-q-${i}`} onClick={() => onSelect({ type: "categoria", label: q })} className="cursor-pointer px-3 py-2 hover:bg-slate-50">{q}</div>
                            ))}
                        </div>

                        {trends && trends.length > 0 && (
                            <div className="mt-3">
                                <div className="text-xs font-semibold text-slate-500">Tendencias</div>
                                {trends.map((t: string, i: number) => (
                                    <div key={`t-${i}`} onClick={() => onSelect({ type: "categoria", label: t })} className="cursor-pointer px-3 py-2 hover:bg-slate-50">{t}</div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
