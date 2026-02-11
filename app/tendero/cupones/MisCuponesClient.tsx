"use client";

import { useEffect, useMemo, useState } from "react";
import type { Cupon } from "@/lib/cupones";
import { clearCuponActivo, getCuponActivo, setCuponActivo } from "@/lib/cuponActivo";

type Props = {
  cupones: Cupon[];
};

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const formatCurrency = (value?: number) =>
  value === undefined || Number.isNaN(value) ? "—" : currency.format(value);

const formatDatetime = (iso?: string) =>
  iso
    ? new Intl.DateTimeFormat("es-CO", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(iso))
    : "—";

export default function MisCuponesClient({ cupones }: Props) {
  const [activeCode, setActiveCode] = useState<string>("");

  useEffect(() => {
    setActiveCode(getCuponActivo());
  }, []);

  const normalizedActive = useMemo(
    () => activeCode.trim().toUpperCase(),
    [activeCode],
  );

  const visibleCupones = useMemo(
    () => cupones.filter((cupon) => cupon.active),
    [cupones],
  );

  const handleActivate = (code: string) => {
    setCuponActivo(code);
    setActiveCode(getCuponActivo());
  };

  const handleClear = () => {
    clearCuponActivo();
    setActiveCode("");
  };

  return (
    <div className="space-y-5 rounded-2xl border border-[color:var(--surface-border)] bg-white p-6 shadow-md">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-[color:var(--text-muted)]">
          Cupones disponibles
        </p>
        <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">
          Mis cupones
        </h1>
        <p className="text-sm text-[color:var(--text-normal)]">
          Activa uno para autollenar el campo en la confirmación de pedido.
        </p>
      </div>

      {visibleCupones.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 px-4 py-3 text-sm text-[color:var(--text-muted)]">
          No hay cupones activos registrados.
        </div>
      ) : (
        <div className="space-y-4">
          {visibleCupones.map((cupon) => {
            const isActive = normalizedActive === cupon.code.toUpperCase();
            return (
              <article
                key={cupon.id}
                className="rounded-xl border border-[color:var(--surface-border)] bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">
                      {cupon.code}
                    </h2>
                    <p className="text-xs uppercase tracking-wide text-[color:var(--text-muted)]">
                      {cupon.type === "percent"
                        ? `${cupon.value}%`
                        : formatCurrency(cupon.value)}{" "}
                      {cupon.minSubtotal ? `(min ${formatCurrency(cupon.minSubtotal)})` : ""}
                    </p>
                  </div>
                  {isActive ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Activo
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 grid gap-2 text-sm text-[color:var(--text-normal)] sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[color:var(--text-muted)]">
                      Inicio
                    </p>
                    <p className="font-medium text-[color:var(--text-strong)]">
                      {formatDatetime(cupon.startDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[color:var(--text-muted)]">
                      Fin
                    </p>
                    <p className="font-medium text-[color:var(--text-strong)]">
                      {formatDatetime(cupon.endDate)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleActivate(cupon.code)}
                    disabled={isActive}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                      isActive
                        ? "border border-emerald-200 bg-emerald-100 text-emerald-700"
                        : "border border-slate-300 bg-white text-[color:var(--text-strong)] hover:border-slate-500"
                    }`}
                  >
                    {isActive ? "ACTIVO" : "ACTIVAR"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <p className="text-sm text-[color:var(--text-muted)]">
          Cupón activo:{" "}
          <span className="font-semibold text-[color:var(--text-strong)]">
            {normalizedActive || "—"}
          </span>
        </p>
        <button
          type="button"
          onClick={handleClear}
          disabled={!normalizedActive}
          className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--text-normal)] transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Quitar cupón activo
        </button>
      </div>
    </div>
  );
}
