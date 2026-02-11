"use client";

import { useEffect, useMemo, useState } from "react";

type Estado = "active" | "scheduled" | "expired" | "paused";

type Cupon = {
  id: string;
  titulo: string;
  descripcion?: string;
  tipo: "percent" | "fixed" | "promo";
  valor: number;
  startAt?: string;
  endAt?: string;
  status: Estado;
  minTotal?: number;
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function safeDateLabel(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

export default function ClientCuponesImpl({ bodegaId }: { bodegaId: string }) {
  const [tab, setTab] = useState<"cupones" | "promos">("cupones");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Cupon[]>([]);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<Estado | "all">("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/bodegas/${bodegaId}/cupones`, {
          cache: "no-store",
        });
        const data = (await res.json()) as { items: Cupon[] };
        if (!cancelled) setItems(data.items ?? []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bodegaId]);

  const filtered = useMemo(() => {
    const isPromo = (x: Cupon) => x.tipo === "promo";
    const base = items.filter((x) => (tab === "promos" ? isPromo(x) : !isPromo(x)));

    return base
      .filter((x) => (estado === "all" ? true : x.status === estado))
      .filter((x) => {
        const needle = q.trim().toLowerCase();
        if (!needle) return true;
        return (
          x.titulo.toLowerCase().includes(needle) ||
          (x.descripcion ?? "").toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => (a.titulo > b.titulo ? 1 : -1));
  }, [items, tab, q, estado]);

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Cupones y Promociones</h1>
          <p className="text-sm text-gray-600">
            Administra descuentos, reglas y vigencias de forma clara.
          </p>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="flex rounded-xl border bg-white p-1">
            <button
              className={cn(
                "rounded-lg px-3 py-1 text-sm",
                tab === "cupones" && "bg-black text-white",
              )}
              onClick={() => setTab("cupones")}
            >
              Cupones
            </button>
            <button
              className={cn(
                "rounded-lg px-3 py-1 text-sm",
                tab === "promos" && "bg-black text-white",
              )}
              onClick={() => setTab("promos")}
            >
              Promos
            </button>
            <button
              className="rounded-lg px-3 py-1 text-sm text-gray-400"
              disabled
              aria-disabled="true"
              title="Próximamente"
            >
              Anuncios
            </button>
          </div>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar…"
            className="h-9 w-full rounded-xl border px-3 text-sm md:w-56"
          />

          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as Estado | "all")}
            className="h-9 rounded-xl border px-2 text-sm"
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="scheduled">Programados</option>
            <option value="paused">Pausados</option>
            <option value="expired">Vencidos</option>
          </select>

          <button
            className="h-9 rounded-xl bg-black px-4 text-sm text-white"
            onClick={() => alert("Luego conectamos modal crear cupón/promo")}
          >
            + Crear
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border bg-white p-3">
        {loading ? (
          <div className="grid gap-3 p-3 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl border p-4">
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="mt-2 h-3 w-48 rounded bg-gray-100" />
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="h-10 rounded bg-gray-100" />
                  <div className="h-10 rounded bg-gray-100" />
                  <div className="col-span-2 h-10 rounded bg-gray-100" />
                </div>
                <div className="mt-4 flex gap-2">
                  <div className="h-9 flex-1 rounded bg-gray-100" />
                  <div className="h-9 flex-1 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-gray-600">No hay resultados.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((x) => (
              <PromoCard key={x.id} item={x} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PromoCard({ item }: { item: Cupon }) {
  const badge =
    item.tipo === "percent"
      ? `${item.valor}%`
      : item.tipo === "fixed"
        ? `$${item.valor}`
        : "PROMO";

  const statusLabel: Record<string, string> = {
    active: "Activo",
    scheduled: "Programado",
    paused: "Pausado",
    expired: "Vencido",
  };

  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{item.titulo}</div>
          {item.descripcion ? (
            <div className="mt-1 text-xs text-gray-600">{item.descripcion}</div>
          ) : null}
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium">
            {badge}
          </span>
          <span className="rounded-full border px-2 py-0.5 text-xs">
            {statusLabel[item.status] ?? item.status}
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-700">
        <div className="rounded-xl bg-gray-50 p-2">
          <div className="text-[11px] text-gray-500">Inicio</div>
          <div className="font-medium">{safeDateLabel(item.startAt)}</div>
        </div>
        <div className="rounded-xl bg-gray-50 p-2">
          <div className="text-[11px] text-gray-500">Fin</div>
          <div className="font-medium">{safeDateLabel(item.endAt)}</div>
        </div>
        <div className="col-span-2 rounded-xl bg-gray-50 p-2">
          <div className="text-[11px] text-gray-500">Mínimo de compra</div>
          <div className="font-medium">{item.minTotal ? `$${item.minTotal}` : "—"}</div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button className="h-9 flex-1 rounded-xl border text-sm">Editar</button>
        <button className="h-9 flex-1 rounded-xl bg-black text-sm text-white">Activar</button>
      </div>
    </div>
  );
}
