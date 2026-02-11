"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type IaResult = {
  timestamp?: string;
  recomendaciones?: string[];
  mejoras?: { categoria: string; items: string[] }[];
};

const STORAGE_KEY = "ia_tienda_result";

export default function TenderoIaCard() {
  const [result, setResult] = useState<IaResult | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      setResult(JSON.parse(raw));
    } catch {
      setResult(null);
    }
  }, []);

  const lastUpdate = result?.timestamp
    ? new Date(result.timestamp).toLocaleString("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    })
    : null;

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-[color:var(--surface-border)] bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs uppercase tracking-wide text-[color:var(--text-muted)]">IA: mejora tu tienda</p>
        <h2 className="text-xl font-semibold text-[color:var(--text-strong)]">Centro IA del tendero</h2>
        <p className="text-sm text-[color:var(--text-normal)] mt-2">
          Analiza tu tienda o genera acciones rápidas para inventario y promociones.
        </p>
        {lastUpdate ? (
          <p className="text-xs text-[color:var(--text-muted)] mt-2">Último análisis: {lastUpdate}</p>
        ) : (
          <p className="text-xs text-[color:var(--text-muted)] mt-2">Aún no hay análisis.</p>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/tendero/ia"
          className="rounded-full border border-[color:var(--surface-border)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--text-strong)] hover:border-slate-400"
        >
          Centro IA
        </Link>
        <Link
          href="/tendero/ia/tienda"
          className="rounded-full bg-gradient-to-r from-sky-600 to-emerald-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:opacity-90"
        >
          Analizar tienda
        </Link>
      </div>
    </article>
  );
}
