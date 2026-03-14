"use client";

import { useState } from "react";

type SugerenciaPromo = {
    nombre: string;
    tipo: string;
    valor: number;
    aplicaA: string;
    categorias?: string[];
    duracion_dias?: number;
    justificacion?: string;
};

type SugerenciaCupon = {
    codigo: string;
    descuento: number;
    tipo: string;
    descripcion: string;
    condicion?: string;
};

type Props = {
    bodegaId: string;
    modo?: "promocion" | "cupon";
};

export default function IaSugerenciasPromos({ bodegaId, modo = "promocion" }: Props) {
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sugerencias, setSugerencias] = useState<(SugerenciaPromo | SugerenciaCupon)[]>([]);
    const [model, setModel] = useState<string | null>(null);

    const generar = async () => {
        setCargando(true);
        setError(null);
        setSugerencias([]);
        try {
            const res = await fetch("/api/ia/sugerir-promos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bodegaId, tipo: modo }),
            });
            const data = await res.json();
            if (!data.ok) {
                setError(data.error || "Error al generar sugerencias");
                return;
            }
            setSugerencias(data.sugerencias || []);
            setModel(data.model || null);
        } catch {
            setError("Error de conexión");
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-slate-900">
                        {modo === "cupon" ? "IA: Generar cupones" : "IA: Sugerir promociones"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Claude analiza tu inventario y sugiere{" "}
                        {modo === "cupon" ? "cupones" : "promociones"} personalizadas
                    </p>
                </div>
                <span className="text-2xl">{modo === "cupon" ? "🎟️" : "🎯"}</span>
            </div>

            <button
                onClick={generar}
                disabled={cargando}
                className="w-full rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition"
            >
                {cargando
                    ? "Analizando inventario..."
                    : `Generar ${modo === "cupon" ? "cupones" : "promociones"} con IA`}
            </button>

            {error && (
                <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
            )}

            {sugerencias.length > 0 && (
                <div className="space-y-3">
                    {model && (
                        <p className="text-xs text-slate-400">Generado con {model}</p>
                    )}
                    {modo === "cupon"
                        ? (sugerencias as SugerenciaCupon[]).map((s, i) => (
                              <div
                                  key={i}
                                  className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-1"
                              >
                                  <div className="flex items-center gap-2">
                                      <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white tracking-wider">
                                          {s.codigo}
                                      </span>
                                      <span className="text-sm font-semibold text-slate-800">
                                          {s.tipo === "porcentaje"
                                              ? `${s.descuento}% de descuento`
                                              : `$${s.descuento.toLocaleString("es-CO")} de descuento`}
                                      </span>
                                  </div>
                                  <p className="text-sm text-slate-700">{s.descripcion}</p>
                                  {s.condicion && (
                                      <p className="text-xs text-slate-500">{s.condicion}</p>
                                  )}
                              </div>
                          ))
                        : (sugerencias as SugerenciaPromo[]).map((s, i) => (
                              <div
                                  key={i}
                                  className="rounded-lg border border-sky-200 bg-sky-50 p-4 space-y-1"
                              >
                                  <div className="flex items-center justify-between">
                                      <span className="font-semibold text-slate-900">{s.nombre}</span>
                                      <span className="rounded-full bg-sky-600 px-2 py-0.5 text-xs font-bold text-white">
                                          {s.tipo === "porcentaje"
                                              ? `${s.valor}%`
                                              : `$${s.valor.toLocaleString("es-CO")}`}
                                      </span>
                                  </div>
                                  {s.duracion_dias && (
                                      <p className="text-xs text-slate-500">
                                          Duración sugerida: {s.duracion_dias} días •{" "}
                                          {s.aplicaA === "todos"
                                              ? "Todos los productos"
                                              : `Categorías: ${s.categorias?.join(", ")}`}
                                      </p>
                                  )}
                                  {s.justificacion && (
                                      <p className="text-xs text-slate-600 italic">
                                          {s.justificacion}
                                      </p>
                                  )}
                              </div>
                          ))}
                </div>
            )}
        </div>
    );
}
