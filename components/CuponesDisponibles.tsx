"use client";

import { useEffect, useMemo, useState } from "react";
import { clearCuponActivo, getCuponActivo, setCuponActivo } from "@/lib/cuponActivo";

const formatCurrency = (value?: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    })
    : "—";

const formatDatetime = (iso?: string) =>
  iso
    ? new Intl.DateTimeFormat("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso))
    : "—";

type Cupon = {
  id?: string;
  code?: string;
  codigo?: string;
  value?: number;
  descuentoCOP?: number;
  minSubtotal?: number;
  minPedidoCOP?: number;
  active?: boolean;
  activo?: boolean;
  startDate?: string;
  endDate?: string;
};

export default function CuponesDisponibles({ bodegaId }: { bodegaId: string }) {
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    if (!bodegaId) {
      setError("Falta el ID de la bodega");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/cupones?bodegaId=${encodeURIComponent(bodegaId)}`, {
      cache: "no-store",
    })
      .then((resp) => resp.json())
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data?.cupones)
          ? data.cupones
          : Array.isArray(data)
            ? data
            : [];
        setCupones(list);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError("No se pudieron cargar los cupones.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bodegaId]);

  const available = useMemo(
    () =>
      cupones.filter((c) =>
        typeof c?.active === "boolean"
          ? c.active
          : typeof c?.activo === "boolean"
            ? c.activo
            : true,
      ),
    [cupones],
  );

  const normalizedActive = active?.toUpperCase() ?? "";

  const handleActivate = (code: string) => {
    if (!code) return;
    setCuponActivo(code);
    setActive(code.toUpperCase());
  };

  const handleClear = () => {
    clearCuponActivo();
    setActive("");
  };

  return (
    <div className="space-y-4 rounded-2xl border border-[color:var(--surface-border)] bg-white p-5 shadow-sm">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-[color:var(--text-muted)]">
          Cupones
        </p>
        <h2 className="text-xl font-semibold text-[color:var(--text-strong)]">
          Debes activar un cupón para que se aplique en la compra.
        </h2>
        <p className="text-sm text-[color:var(--text-normal)]">
          Activa uno para que aparezca automáticamente en la confirmación del pedido.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--text-normal)]">
        <span>
          Cupón activo:{" "}
          <strong className="text-[color:var(--text-strong)]">
            {normalizedActive || "Ninguno"}
          </strong>
        </span>
        <button
          type="button"
          onClick={handleClear}
          disabled={!normalizedActive}
          className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--text-normal)] transition hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Quitar cupón activo
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-[color:var(--surface-border)] bg-slate-50 px-4 py-3 text-sm text-[color:var(--text-muted)]">
          Cargando cupones...
        </div>
      ) : available.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[color:var(--surface-border)] bg-slate-50 px-4 py-3 text-sm text-[color:var(--text-muted)]">
          No hay cupones disponibles.
        </div>
      ) : (
        <div className="grid gap-3">
          {available.map((cupon) => {
            const code = String(cupon.code ?? cupon.codigo ?? "").trim();
            const isActive = code && normalizedActive === code.toUpperCase();
            const discountLabel =
              cupon.descuentoCOP != null
                ? `${cupon.descuentoCOP} COP`
                : typeof cupon.value === "number"
                  ? `${cupon.value}%`
                  : null;
            const minValue =
              cupon.minSubtotal != null ? cupon.minSubtotal : cupon.minPedidoCOP;
            const minLabel = minValue != null ? `mínimo ${formatCurrency(minValue)}` : null;

            return (
              <div
                key={cupon.id ?? code}
                className="rounded-2xl border border-[color:var(--surface-border)] bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-[color:var(--text-strong)]">
                      {code || "(sin código)"}
                    </div>
                    <div className="text-sm text-[color:var(--text-muted)]">
                      {discountLabel}
                      {discountLabel && minLabel ? " · " : ""}
                      {minLabel}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {isActive ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                        Activo
                      </span>
                    ) : null}
                    <button
                      type="button"
                      className={`rounded-lg px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${isActive
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border border-slate-300 bg-white text-[color:var(--text-strong)] hover:border-slate-400 hover:bg-white"
                        }`}
                      onClick={() => handleActivate(code)}
                      disabled={!code || !!isActive}
                    >
                      {isActive ? "ACTIVO" : "ACTIVAR"}
                    </button>
                  </div>
                </div>
                <div className="mt-3 text-xs text-[color:var(--text-muted)]">
                  Inicio: {formatDatetime(cupon.startDate)}, Fin: {formatDatetime(cupon.endDate)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
