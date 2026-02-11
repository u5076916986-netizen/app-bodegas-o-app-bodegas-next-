"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Pedido } from "@/lib/pedidos";
import { getTenderoPhone, saveTenderoPhone } from "@/lib/storage";
import { buildFuseIndex, smartSearch } from "@/lib/smartSearch";
import { expandQuery } from "@/lib/synonyms";

const getStateColor = (estado: string) => {
  switch (estado) {
    case "nuevo":
      return "bg-yellow-50 text-yellow-700";
    case "aceptado":
      return "bg-blue-50 text-blue-700";
    case "listo_para_envio":
      return "bg-purple-50 text-purple-700";
    case "en_camino":
      return "bg-orange-50 text-orange-700";
    case "entregado":
      return "bg-green-50 text-green-700";
    case "despachado":
      return "bg-green-50 text-green-700";
    default:
      return "bg-gray-50 text-gray-700";
  }
};

const getStateLabel = (estado: string) => {
  switch (estado) {
    case "listo_para_envio":
      return "Listo para envío";
    case "en_camino":
      return "En camino";
    case "entregado":
      return "Entregado";
    case "despachado":
      return "Despachado";
    case "aceptado":
      return "Aceptado";
    case "nuevo":
      return "Nuevo";
    default:
      return estado;
  }
};

const formatCurrency = (value: number | null) => {
  if (value === null) return "N/D";
  return value.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
};

const formatDateTime = (value?: string) => {
  if (!value) return "N/D";
  return new Date(value).toLocaleString("es-CO");
};

const formatDateOnly = (value?: string) => {
  if (!value) return "N/D";
  return new Date(value).toLocaleDateString("es-CO");
};

export default function MisPedidosClient() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchPhone, setSearchPhone] = useState("");
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  // Cargar teléfono guardado y pedidos
  useEffect(() => {
    const loadPedidos = async () => {
      try {
        setLoading(true);
        setError(null);

        const savedPhone = getTenderoPhone();

        if (!savedPhone) {
          setShowPhoneForm(true);
          setPedidos([]);
          setLoading(false);
          return;
        }

        setSearchPhone(savedPhone);

        // Llamar API con filtro de tendero
        const res = await fetch(
          `/api/pedidos?role=tendero&tenderoPhone=${encodeURIComponent(savedPhone)}`
        );
        if (!res.ok) throw new Error("Error al cargar pedidos");

        const data = (await res.json()) as { ok: boolean; pedidos: Pedido[]; error?: string };
        if (data.ok) {
          setPedidos(data.pedidos || []);
        } else {
          throw new Error(data.error || "Error desconocido");
        }
      } catch (err: any) {
        setError(err.message || "Error al cargar pedidos");
        setPedidos([]);
      } finally {
        setLoading(false);
      }
    };

    loadPedidos();
  }, []);

  const handleSearchByPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPhone.trim()) {
      setError("Por favor ingresa un teléfono");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Guardar para futuras visitas
      saveTenderoPhone(searchPhone);

      // Llamar API
      const res = await fetch(
        `/api/pedidos?role=tendero&tenderoPhone=${encodeURIComponent(searchPhone)}`
      );
      if (!res.ok) throw new Error("Error al cargar pedidos");

      const data = (await res.json()) as { ok: boolean; pedidos: Pedido[]; error?: string };
      if (data.ok) {
        setPedidos(data.pedidos || []);
        setShowPhoneForm(false);
      } else {
        throw new Error(data.error || "Error desconocido");
      }
    } catch (err: any) {
      setError(err.message || "Error al buscar pedidos");
    } finally {
      setLoading(false);
    }
  };

  const { fuse } = useMemo(() => {
    const enriched = pedidos.map((p) => ({
      ...p,
      nombre: p.cliente?.nombre ?? p.datosEntrega?.nombre ?? "",
      sku: p.pedidoId ?? p.id ?? "",
      categoria: p.estado ?? "",
      tags: [p.direccion ?? p.datosEntrega?.direccion ?? "", p.bodegaId ?? ""],
      unidad: "",
      presentacion: "",
    }));
    return buildFuseIndex(enriched);
  }, [pedidos]);

  const filteredPedidos = useMemo(() => {
    if (!searchQ.trim()) return pedidos;
    const expanded = expandQuery(searchQ);
    return smartSearch(fuse, expanded, 200) as Pedido[];
  }, [pedidos, searchQ, fuse]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Cargando tus pedidos...</p>
      </div>
    );
  }

  if (showPhoneForm) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 space-y-4">
        <p className="text-sm text-slate-700">
          Para ver tus pedidos, ingresa el teléfono que usaste al confirmar.
        </p>
        <form onSubmit={handleSearchByPhone} className="flex gap-3">
          <input
            type="tel"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            placeholder="3101234567"
            className="flex-1 px-3 py-2 border border-slate-300 rounded outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Buscar
          </button>
        </form>
        {error && (
          <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded text-sm">
          Error: {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-600">
          {searchPhone && <span>Teléfono: {searchPhone}</span>}
          <span className="ml-4">Total de pedidos: {filteredPedidos.length}</span>
        </div>
        <button
          onClick={() => setShowPhoneForm(true)}
          className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
        >
          Cambiar teléfono
        </button>
      </div>

      <div className="mb-4">
        <input
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="Buscar por bodega, dirección, estado o ID"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filteredPedidos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-600">
          <p>No hay pedidos registrados con este teléfono.</p>
          <p className="text-xs text-slate-500 mt-2">
            Crea tu primer pedido en{" "}
            <Link href="/bodegas" className="text-blue-600 hover:underline">
              Bodegas
            </Link>
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Pedido</th>
                <th className="px-4 py-2">Bodega</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPedidos
                .slice()
                .reverse()
                .map((pedido) => (
                  <tr key={pedido.pedidoId} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-700">
                      <span suppressHydrationWarning>
                        {formatDateTime(pedido.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sky-700 font-mono text-xs">
                      {pedido.pedidoId?.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {pedido.bodegaId}
                    </td>
                    <td className="px-4 py-2 font-semibold text-slate-900">
                      {formatCurrency(pedido.total)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStateColor(pedido.estado)
                          }`}
                      >
                        {getStateLabel(pedido.estado)}
                      </span>
                      {pedido.estado === "en_camino" && pedido.repartidorNombre && (
                        <div className="text-xs text-gray-500 mt-1">
                          Con: {pedido.repartidorNombre}
                        </div>
                      )}
                      {pedido.estado === "entregado" && pedido.deliveredAt && (
                        <div className="text-xs text-green-600 mt-1">
                          <span suppressHydrationWarning>
                            {formatDateOnly(pedido.deliveredAt)}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/pedidos/${pedido.pedidoId}`}
                        className="text-blue-600 hover:underline text-xs font-medium"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
