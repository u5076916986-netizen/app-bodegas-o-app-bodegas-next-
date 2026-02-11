"use client";

import { useState, ChangeEvent } from "react";
import Link from "next/link";

export default function RegistroTenderoPage() {
  const [step, setStep] = useState(1); // 1: Datos, 2: Foto, 3: Analizar, 4: Finalizar
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ message: string; recommendations: string[] } | null>(null);

  const handlePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setPhoto(file);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");

    try {
      // Persistencia local del perfil
      window.localStorage.setItem("tendero_profile", JSON.stringify({ name, location }));

      const formData = new FormData();
      formData.append("first_name", name);
      formData.append("location", location);
      formData.append("notes", notes);
      if (photo) {
        formData.append("photo", photo);
      }

      const response = await fetch("/api/ia/tienda", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "No se pudo analizar");
      }

      setResult({
        message: data.message,
        recommendations: data.recommendations ?? [],
      });
      setStep(4);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-slate-500">Registro Tendero</p>
          <span className="text-xs font-bold text-slate-400">Paso {step} de 4</span>
        </div>
        <h1 className="text-3xl font-semibold text-slate-900">Optimiza tu tienda con IA</h1>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* PASO 1: DATOS */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">1. Tus Datos</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Nombre
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  placeholder="Tu nombre"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Ubicación
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  placeholder="Ciudad / Barrio"
                />
              </label>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep(2)}
                disabled={!name || !location}
                className="rounded-xl bg-slate-900 px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: FOTO */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">2. Foto de la Tienda</h2>
            <label className="block text-sm font-semibold text-slate-700">
              Sube una foto (opcional)
              <input
                type="file"
                accept="image/*"
                onChange={handlePhoto}
                className="mt-1 w-full rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Notas adicionales
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                rows={3}
                placeholder="Ej: Quiero mejorar la iluminación..."
              />
            </label>
            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(1)} className="text-sm font-semibold text-slate-600 hover:underline">
                Atrás
              </button>
              <button
                onClick={() => setStep(3)}
                className="rounded-xl bg-slate-900 px-6 py-2 text-sm font-semibold text-white"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: ANALIZAR */}
        {step === 3 && (
          <div className="space-y-4 text-center">
            <h2 className="text-lg font-semibold text-slate-800">3. Confirmar Análisis</h2>
            <p className="text-sm text-slate-600">
              Vamos a analizar tu tienda en <strong>{location}</strong>
              {photo ? " usando la foto proporcionada" : " sin foto adjunta"}.
            </p>
            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(2)} className="text-sm font-semibold text-slate-600 hover:underline">
                Atrás
              </button>
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="rounded-xl bg-[color:var(--brand-primary)] px-8 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-md hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Analizando..." : "Analizar Tienda"}
              </button>
            </div>
          </div>
        )}

        {/* PASO 4: FINALIZAR */}
        {step === 4 && result && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">
                ✨
              </div>
              <h2 className="text-xl font-bold text-slate-900">¡Análisis Completado!</h2>
              <p className="text-sm text-slate-600 mt-1">{result.message}</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">Recomendaciones IA</h3>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700">
                    <span className="text-blue-500">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-center pt-2">
              <Link
                href="/"
                className="rounded-xl border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
