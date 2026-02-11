"use client";

import React, { useEffect, useRef, useState } from "react";
import { buildSearchUrl } from "@/lib/search";
import { useRouter } from "next/navigation";
import { useVoiceSearch } from "@/lib/useVoiceSearch";

export default function SearchBox({
    initialQ = "",
    mode = "inline",
    onResults,
    showVoiceButton = true,
}: {
    initialQ?: string;
    mode?: "inline" | "page";
    onResults?: (items: any[]) => void;
    showVoiceButton?: boolean;
}) {
    const [q, setQ] = useState(initialQ || "");
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<any[]>([]);
    const timerRef = useRef<number | null>(null);
    const controllerRef = useRef<AbortController | null>(null);
    const router = useRouter();
    const { isListening, voiceSupported, transcript, error, toggleListening, clearTranscript } = useVoiceSearch(
        (text) => {
            // Callback cuando el transcript cambia
            if (text) {
                console.log("[SearchBox] Transcript recibido:", text);
                // Si no está escuchando, actualiza y busca
                if (!isListening) {
                    setQ(text);
                }
            }
        }
    );

    const doSearch = async (query: string) => {
        // Validate query length
        if (!query || query.trim().length < 2) {
            setItems([]);
            onResults?.([]);
            return;
        }

        // Cancel previous request
        if (controllerRef.current) {
            controllerRef.current.abort();
        }
        controllerRef.current = new AbortController();

        setLoading(true);
        try {
            const url = buildSearchUrl("/api/buscar", { q: query, limit: 20 });
            const res = await fetch(url, { signal: controllerRef.current.signal });
            const data = await res.json();
            if (data?.ok) {
                // Deduplicate results by productId (stable key)
                const seen = new Set<string>();
                const dedupedItems = [];
                for (const item of (data.items || [])) {
                    const key = item.productId; // Use productId as unique key
                    if (!seen.has(key)) {
                        seen.add(key);
                        dedupedItems.push(item);
                    }
                }
                // Limit to 12 suggestions
                const limited = dedupedItems.slice(0, 12);
                setItems(limited);
                onResults?.(limited);
            }
        } catch (e: any) {
            // Ignore AbortError (cancelled request)
            if (e.name !== "AbortError") {
                console.error(e);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isListening) {
            if (timerRef.current) window.clearTimeout(timerRef.current);
            timerRef.current = window.setTimeout(() => doSearch(q), 300);
            return () => {
                if (timerRef.current) window.clearTimeout(timerRef.current);
            };
        }
    }, [q, isListening]);

    // Update search query when voice transcript changes
    useEffect(() => {
        if (transcript && !isListening) {
            console.log("[SearchBox] Actualizando q con transcript:", transcript);
            setQ(transcript);
        }
    }, [transcript, isListening]);

    return (
        <div className="relative w-full">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <input
                        value={isListening ? transcript : q}
                        onChange={(e) => {
                            if (!isListening) {
                                setQ(e.target.value);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                if (mode === "page") router.push(`/buscar?q=${encodeURIComponent(q)}`);
                                else doSearch(q);
                            }
                        }}
                        placeholder={isListening ? "🎤 Escuchando..." : "Buscar productos..."}
                        className={`w-full rounded-lg border p-2 text-sm transition ${isListening ? "border-blue-500 bg-blue-50 ring-1 ring-blue-300" : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                            }`}
                        disabled={isListening}
                    />
                    {error && (
                        <div className="absolute top-10 left-0 right-0 mt-1 bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700 z-50">
                            ⚠️ {error}
                        </div>
                    )}
                </div>

                {/* Voice button */}
                {voiceSupported && showVoiceButton && (
                    <button
                        onClick={toggleListening}
                        className={`px-3 py-2 rounded-lg font-semibold transition ${isListening
                            ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                            }`}
                        title={isListening ? "Detener grabación" : "Buscar por voz"}
                    >
                        {isListening ? "🛑" : "🎤"}
                    </button>
                )}

                <button
                    onClick={() => {
                        setQ("");
                        clearTranscript();
                        setItems([]);
                        onResults?.([]);
                    }}
                    className="px-3 py-2 text-sm bg-slate-100 rounded-lg hover:bg-slate-200 transition"
                    title="Limpiar búsqueda"
                >
                    ✕
                </button>
            </div>

            {mode === "inline" && q.trim().length >= 2 && (
                <div className="absolute z-40 mt-2 w-full rounded-lg bg-white shadow-xl border border-gray-200">
                    {loading ? (
                        <div className="p-3 text-sm text-gray-500">Buscando...</div>
                    ) : items.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">Sin resultados</div>
                    ) : (
                        <div className="max-h-72 overflow-auto">
                            {items.map((it) => (
                                <a
                                    key={`${it.bodegaId}::${it.productId}`}
                                    href={`/bodegas/${it.bodegaId}?q=${encodeURIComponent(q)}`}
                                    className="block border-b px-3 py-2 text-sm hover:bg-blue-50 transition"
                                >
                                    <div className="font-semibold text-slate-900">{it.nombre}</div>
                                    <div className="text-xs text-slate-600">
                                        {it.categoria} — {it.bodegaNombre} — {it.zona ?? it.ciudad}
                                    </div>
                                    {it.precio_cop && (
                                        <div className="text-xs font-semibold text-blue-600 mt-1">
                                            ${it.precio_cop.toLocaleString("es-CO")}
                                        </div>
                                    )}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
