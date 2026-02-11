"use client";

import { ChangeEvent, useEffect, useState } from "react";
import Link from "next/link";

type IaResult = {
    timestamp?: string;
    recomendaciones?: string[];
    mejoras?: { categoria: string; items: string[] }[];
    productosDetectados?: Array<{ nombre?: string; categoria?: string; precio_cop?: number; stock?: number }>;
};

const STORAGE_KEY = "ia_tienda_result";

export default function TenderoIaTiendaPage() {
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [notes, setNotes] = useState("");
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<IaResult | null>(null);

    useEffect(() => {
        const raw = window.localStorage.getItem("tendero_profile");
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw) as { name?: string; location?: string };
            if (parsed?.name) setName(parsed.name);
            if (parsed?.location) setLocation(parsed.location);
        } catch {
            // ignore
        }
    }, []);

    const handlePhoto = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        setPhoto(file);
        if (!file) {
            setPhotoPreview(null);
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = typeof reader.result === "string" ? reader.result : null;
            setPhotoPreview(dataUrl);
        };
        reader.readAsDataURL(file);
    };

    const handleAnalyze = async () => {
        if (!name.trim() || !location.trim()) {
            setError("Completa tu nombre y ubicación.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const payload = {
                first_name: name.trim(),
                location: location.trim(),
                notes: notes.trim() || undefined,
                photo_base64: photoPreview ?? undefined,
            };

            const response = await fetch("/api/ia/tienda", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (!response.ok || !data.ok) {
                throw new Error(data.error || "No se pudo analizar la tienda");
            }

            const next: IaResult = {
                timestamp: new Date().toISOString(),
                recomendaciones: data.recommendations ?? [],
                productosDetectados: Array.isArray(data.productosDetectados)
                    ? data.productosDetectados
                    : [],
            };
            setResult(next);
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            window.localStorage.setItem(
                "tendero_profile",
                JSON.stringify({ name: name.trim(), location: location.trim() }),
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error de red al analizar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="mx-auto max-w-4xl space-y-6 p-6">
            <header className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">IA para tenderos</p>
                <h1 className="text-3xl font-semibold text-slate-900">Analiza tu tienda</h1>
                <p className="text-sm text-slate-600">
                    Sube una foto opcional y recibe recomendaciones practicas.
                </p>
            </header>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-semibold text-slate-700">
                        Nombre
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            placeholder="Tu nombre"
                        />
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">
                        Ubicacion
                        <input
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            placeholder="Ciudad / Barrio"
                        />
                    </label>
                </div>

                <label className="block text-sm font-semibold text-slate-700">
                    Foto de la tienda (opcional)
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhoto}
                        className="mt-2 w-full rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500"
                    />
                </label>

                {photoPreview ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <img
                            src={photoPreview}
                            alt="Vista previa"
                            className="max-h-60 w-full rounded-lg object-cover"
                        />
                    </div>
                ) : null}

                <label className="block text-sm font-semibold text-slate-700">
                    Notas adicionales
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                        placeholder="Ej: quiero mejorar la iluminacion o reorganizar vitrinas"
                    />
                </label>

                {error ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                        type="button"
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="flex-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                        {loading ? "Analizando..." : "Analizar tienda"}
                    </button>
                    <Link
                        href="/tendero"
                        className="rounded-xl border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Volver a bodegas
                    </Link>
                </div>
            </section>

            {result ? (
                <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm space-y-3">
                    <h2 className="text-lg font-semibold text-emerald-900">Recomendaciones IA</h2>
                    <p className="text-xs text-emerald-800">
                        Guardado en tu panel. Puedes revisarlo desde el Centro IA.
                    </p>
                    {result.recomendaciones && result.recomendaciones.length > 0 ? (
                        <ul className="space-y-2 text-sm text-emerald-900">
                            {result.recomendaciones.map((rec, idx) => (
                                <li key={idx} className="flex gap-2">
                                    <span className="text-emerald-600">•</span>
                                    <span>{rec}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-emerald-900">No hay recomendaciones nuevas.</p>
                    )}
                    {result.productosDetectados && result.productosDetectados.length > 0 ? (
                        <div className="mt-4 rounded-xl border border-emerald-200 bg-white/70 p-4">
                            <h3 className="text-sm font-semibold text-emerald-900">
                                Productos detectados en la foto
                            </h3>
                            <ul className="mt-2 space-y-2 text-sm text-emerald-900">
                                {result.productosDetectados.map((producto, idx) => (
                                    <li key={`${producto.nombre ?? "producto"}-${idx}`} className="flex flex-wrap gap-2">
                                        <span className="font-semibold">
                                            {producto.nombre ?? "Producto"}
                                        </span>
                                        {producto.categoria ? <span>· {producto.categoria}</span> : null}
                                        {typeof producto.precio_cop === "number" ? (
                                            <span>· ${producto.precio_cop}</span>
                                        ) : null}
                                        {typeof producto.stock === "number" ? (
                                            <span>· stock {producto.stock}</span>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </section>
            ) : null}
        </main>
    );
}
