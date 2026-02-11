"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import type { Pedido } from "@/lib/pedidos";

const formatCurrency = (value: number | null) => {
  if (value === null) return "N/D";
  return value.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
};

const getStateColor = (estado: string) => {
  switch (estado) {
    case "listo_para_envio":
      return "bg-blue-100 text-blue-800";
    case "en_camino":
      return "bg-yellow-100 text-yellow-800";
    case "entregado":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
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
    default:
      return estado;
  }
};

type RepartidorClientProps = {
  initialPedidos: Pedido[];
};

export default function RepartidorClient({ initialPedidos }: RepartidorClientProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>(initialPedidos);
  const [tab, setTab] = useState<"available" | "mydeliveries">("available");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Usar repartidor dev por defecto
  const REPARTIDOR_ID = "DEV_REP_001";
  const REPARTIDOR_NOMBRE = "Repartidor Demo";

  // Filtrar pedidos
  const available = useMemo(
    () => pedidos.filter((p) => !p.repartidorId && p.estado === "listo_para_envio"),
    [pedidos],
  );

  const myDeliveries = useMemo(
    () =>
      pedidos.filter(
        (p) => p.repartidorId === REPARTIDOR_ID && p.estado !== "entregado",
      ),
    [pedidos],
  );

  const displayedPedidos = tab === "available" ? available : myDeliveries;

  const handleRefresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/pedidos?role=repartidor&repartidorId=${REPARTIDOR_ID}`);
      if (!res.ok) throw new Error("Error al cargar pedidos");

      const data = (await res.json()) as { ok: boolean; pedidos: Pedido[] };
      if (data.ok) {
        setPedidos(data.pedidos);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTakePedido = async (pedidoId: string) => {
    try {
      setActionInProgress(pedidoId);
      setError(null);
      const res = await fetch(`/api/pedidos/${pedidoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "take",
          repartidorId: REPARTIDOR_ID,
          repartidorNombre: REPARTIDOR_NOMBRE,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as any).error || "Error al tomar pedido");
      }

      const data = (await res.json()) as { ok: boolean; pedido?: Pedido };
      if (data.ok && data.pedido) {
        setPedidos((prev) =>
          prev.map((p) => (p.pedidoId === pedidoId ? data.pedido! : p)),
        );
        setSuccess("✓ Pedido tomado exitosamente");
        setTimeout(() => setSuccess(null), 2000);
      }
    } catch (err: any) {
      setError(err.message || "Error al tomar pedido");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleStartDelivery = async (pedidoId: string) => {
    try {
      setActionInProgress(pedidoId);
      setError(null);
      const res = await fetch(`/api/pedidos/${pedidoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start_delivery" }),
      });

      if (!res.ok) {
        throw new Error("Error al iniciar entrega");
      }

      const data = (await res.json()) as { ok: boolean; pedido?: Pedido };
      if (data.ok && data.pedido) {
        setPedidos((prev) =>
          prev.map((p) => (p.pedidoId === pedidoId ? data.pedido! : p)),
        );
        setSuccess("✓ Entrega iniciada");
        setTimeout(() => setSuccess(null), 2000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeliver = async (pedidoId: string) => {
    try {
      setActionInProgress(pedidoId);
      setError(null);
      const res = await fetch(`/api/pedidos/${pedidoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deliver" }),
      });

      if (!res.ok) {
        throw new Error("Error al marcar como entregado");
      }

      const data = (await res.json()) as { ok: boolean; pedido?: Pedido };
      if (data.ok && data.pedido) {
        setPedidos((prev) =>
          prev.map((p) => (p.pedidoId === pedidoId ? data.pedido! : p)),
        );
        setSuccess("✓ Pedido entregado");
        setTimeout(() => setSuccess(null), 2000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Botones de acción */}
      <div className="flex gap-3">
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
        <Link href="/bodegas" className="px-4 py-2 border rounded hover:bg-gray-50">
          Volver
        </Link>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-100 text-green-800 rounded text-sm">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setTab("available")}
          className={`px-4 py-2 font-medium ${
            tab === "available"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Disponibles ({available.length})
        </button>
        <button
          onClick={() => setTab("mydeliveries")}
          className={`px-4 py-2 font-medium ${
            tab === "mydeliveries"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Mis entregas ({myDeliveries.length})
        </button>
      </div>

      {/* Lista de pedidos */}
      {displayedPedidos.length === 0 ? (
        <div className="p-8 text-center text-gray-500 border rounded-lg bg-gray-50">
          <p>No hay pedidos en esta sección</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayedPedidos.map((pedido) => (
            <div
              key={pedido.pedidoId}
              className="p-4 border rounded-lg shadow-sm hover:shadow-md transition bg-white"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold">
                    ID Pedido
                  </p>
                  <p className="font-mono text-sm">{pedido.pedidoId.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold">
                    Total
                  </p>
                  <p className="font-semibold">{formatCurrency(pedido.total)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold">
                    Estado
                  </p>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStateColor(
                      pedido.estado,
                    )}`}
                  >
                    {getStateLabel(pedido.estado)}
                  </span>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold">
                    Dirección
                  </p>
                  <p className="text-sm text-gray-700 truncate">
                    {pedido.datosEntrega?.direccion || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {/* Botón Tomar */}
                {!pedido.repartidorId && pedido.estado === "listo_para_envio" && (
                  <button
                    onClick={() => handleTakePedido(pedido.pedidoId)}
                    disabled={actionInProgress === pedido.pedidoId}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm transition"
                  >
                    {actionInProgress === pedido.pedidoId ? "..." : "Tomar"}
                  </button>
                )}

                {/* Botón Iniciar entrega */}
                {pedido.repartidorId === REPARTIDOR_ID &&
                  pedido.estado === "listo_para_envio" && (
                    <button
                      onClick={() => handleStartDelivery(pedido.pedidoId)}
                      disabled={actionInProgress === pedido.pedidoId}
                      className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 text-sm transition"
                    >
                      {actionInProgress === pedido.pedidoId ? "..." : "En camino"}
                    </button>
                  )}

                {/* Botón Entregar */}
                {pedido.repartidorId === REPARTIDOR_ID &&
                  pedido.estado === "en_camino" && (
                    <button
                      onClick={() => handleDeliver(pedido.pedidoId)}
                      disabled={actionInProgress === pedido.pedidoId}
                      className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 text-sm transition"
                    >
                      {actionInProgress === pedido.pedidoId ? "..." : "Entregado"}
                    </button>
                  )}

                {/* Info de entrega */}
                {pedido.estado === "entregado" && pedido.deliveredAt && (
                  <div className="text-xs text-gray-600">
                    Entregado:{" "}
                    {new Date(pedido.deliveredAt).toLocaleString("es-CO")}
                  </div>
                )}

                {/* Link a detalle */}
                <Link
                  href={`/pedidos/${pedido.pedidoId}`}
                  className="px-4 py-2 border rounded hover:bg-gray-50 text-sm ml-auto"
                >
                  Ver detalle
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
