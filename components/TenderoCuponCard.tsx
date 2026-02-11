"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCuponActivo } from "@/lib/cuponActivo";

export default function TenderoCuponCard() {
  const [active, setActive] = useState(() => getCuponActivo());

  useEffect(() => {
    const handler = () => setActive(getCuponActivo());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-[color:var(--surface-border)] bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs uppercase tracking-wide text-[color:var(--text-muted)]">Cupón activo</p>
        <h2 className="text-xl font-semibold text-[color:var(--text-strong)]">
          {active || "No tienes cupón activo"}
        </h2>
        <p className="text-sm text-[color:var(--text-normal)] mt-2">
          Activa un cupón y se aplicará automáticamente en el checkout de la bodega.
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/tendero/cupones"
          className="rounded-full border border-[color:var(--surface-border)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--text-strong)] hover:border-slate-400"
        >
          Activar cupón
        </Link>
        <Link
          href="/bodegas"
          className="rounded-full bg-[color:var(--brand-primary)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:opacity-90"
        >
          Ver bodegas
        </Link>
      </div>
    </article>
  );
}
