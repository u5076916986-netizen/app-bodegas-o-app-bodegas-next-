"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getTenderoPhone } from "@/lib/storage";

const LEVEL_STEP = 1000;

export default function TenderoPuntosCard() {
  const [puntos, setPuntos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redeemValue, setRedeemValue] = useState(0);
  const [redeemStatus, setRedeemStatus] = useState<string | null>(null);
  const [tenderoId, setTenderoId] = useState<string | null>(null);

  useEffect(() => {
    const id = getTenderoPhone();
    setTenderoId(id);
  }, []);

  useEffect(() => {
    if (!tenderoId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/movimientos?tenderoId=${encodeURIComponent(tenderoId)}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setError(data.error || "No se pudieron cargar los puntos");
          return;
        }
        setPuntos(Number(data.balance ?? 0));
      } catch {
        setError("No se pudieron cargar los puntos");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [tenderoId]);

  const handleRedeem = async () => {
    if (!tenderoId) {
      setRedeemStatus("No se encontró el tendero.");
      return;
    }
    if (redeemValue <= 0) {
      setRedeemStatus("Ingresa un valor válido.");
      return;
    }
    try {
      setRedeemStatus(null);
      const res = await fetch("/api/movimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenderoId, puntos: redeemValue }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setRedeemStatus(data.error || "No se pudo redimir");
        return;
      }
      setPuntos(Number(data.balance ?? 0));
      setRedeemValue(0);
      setRedeemStatus("Redención exitosa");
    } catch {
      setRedeemStatus("No se pudo redimir");
    }
  };

  const level = useMemo(() => Math.floor(puntos / LEVEL_STEP), [puntos]);
  const progress = useMemo(() => Math.min(1, (puntos % LEVEL_STEP) / LEVEL_STEP), [puntos]);

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-[color:var(--surface-border)] bg-white p-5 shadow-sm">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-[color:var(--text-muted)]">Mis puntos</p>
        <h2 className="text-3xl font-semibold text-[color:var(--text-strong)]">
          {loading ? "..." : puntos}
        </h2>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
        <p className="text-sm text-[color:var(--text-normal)]">
          Nivel {level + 1} • Ganas puntos por cada compra. Entre más puntos, mejores promociones.
        </p>
        <progress
          className="h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-slate-200 [&::-webkit-progress-value]:bg-[color:var(--brand-primary)] [&::-moz-progress-bar]:bg-[color:var(--brand-primary)]"
          value={Math.round(progress * 100)}
          max={100}
        />
        <p className="text-xs text-[color:var(--text-muted)]">
          {Math.round(progress * 100)}% hacia el próximo nivel ({LEVEL_STEP} pts)
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/bodegas"
          className="rounded-full border border-[color:var(--surface-border)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--text-strong)] transition hover:border-slate-400"
        >
          Comprar ahora
        </Link>
        <Link
          href="/pedidos"
          className="rounded-full bg-[color:var(--brand-primary)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:opacity-90"
        >
          Ver pedidos
        </Link>
      </div>
      <div className="mt-4 rounded-xl border border-[color:var(--surface-border)] bg-slate-50 p-3 text-xs text-slate-700">
        <p className="text-xs font-semibold text-slate-600">Canjear puntos</p>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            value={redeemValue}
            onChange={(e) => setRedeemValue(Number(e.target.value))}
            placeholder="Puntos"
            aria-label="Puntos a redimir"
            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
          />
          <button
            type="button"
            onClick={handleRedeem}
            className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
          >
            Redimir
          </button>
        </div>
        {redeemStatus ? (
          <p className="mt-2 text-[11px] text-slate-600">{redeemStatus}</p>
        ) : null}
      </div>
    </article>
  );
}
