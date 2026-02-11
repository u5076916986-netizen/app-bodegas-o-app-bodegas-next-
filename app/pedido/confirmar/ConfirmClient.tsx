"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Bodega, Producto } from "@/lib/csv";
import { getCartKey } from "@/lib/cartStorage";
import { type Cupon, validateCupon } from "@/lib/cupones";
import { calcPuntosPedido } from "@/lib/puntos";
import { getCuponActivo } from "@/lib/cuponActivo";
import { saveTenderoPhone, saveBodegaId } from "@/lib/storage";
import { clearCart, getCart } from "@/lib/cart";
import StepperNav from "@/components/StepperNav";

type CartLine = {
  producto: Producto;
  quantity: number;
};

type PersistedCart = {
  productoId: string;
  quantity: number;
}[];

type Props = {
  bodegaId: string;
  bodega: Bodega;
  productos: Producto[];
  cupones?: Cupon[];
};

const formatCurrency = (value: number | null) => {
  if (value === null) return "N/D";
  return value.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
};

const buildPedidoId = (bodegaId: string) => {
  const cleaned = (bodegaId || "").trim() || "BOD";
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PED_${cleaned}_${random}`;
};

export default function ConfirmClient({ bodegaId, bodega, productos, cupones }: Props) {
  const router = useRouter();
  const cuponesList = useMemo(() => cupones ?? [], [cupones]);
  const [items, setItems] = useState<CartLine[]>([]);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [metodoPago, setMetodoPago] = useState("contraentrega");
  const [cuponInput, setCuponInput] = useState("");
  const [appliedCupon, setAppliedCupon] = useState<Cupon | null>(null);
  const [cuponError, setCuponError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [successPedidoId, setSuccessPedidoId] = useState<string | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Ref para scroll al error si es necesario
  const formRef = useRef<HTMLDivElement>(null);

  const storageKey = getCartKey(bodegaId);

  const totalItems = useMemo(
    () => items.reduce((sum, line) => sum + line.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, line) =>
          sum +
          (line.producto.precio_cop ?? 0) * Math.max(0, line.quantity || 0),
        0,
      ),
    [items],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const persisted = getCart(bodegaId);
    if (persisted.length === 0) {
      setHydrated(true);
      return;
    }
    try {
      const parsed: PersistedCart = persisted.map((item) => ({
        productoId: item.productoId,
        quantity: Number(item.cantidad ?? item.quantity ?? 0),
      }));
      let missing = 0;
      const hydratedItems: CartLine[] = parsed
        .map(({ productoId, quantity }) => {
          const producto = productos.find(
            (p) => p.producto_id === productoId,
          );
          if (!producto) {
            missing += 1;
            return null;
          }
          return { producto, quantity: Math.max(1, quantity) };
        })
        .filter(Boolean) as CartLine[];
      setItems(hydratedItems);
    } catch (err) {
      console.warn("No se pudo leer el carrito desde localStorage", err);
    } finally {
      setHydrated(true);
    }
  }, [storageKey, productos]);

  // Auto-aplicar cupón activo desde localStorage al cargar
  useEffect(() => {
    if (!hydrated) return;
    const activeCode = getCuponActivo();
    // Solo intentar aplicar si hay código, no hay uno ya aplicado y el input está vacío
    if (activeCode && !appliedCupon && !cuponInput) {
      setCuponInput(activeCode);
      const res = validateCupon(cuponesList, activeCode, bodegaId, subtotal);
      if (res.ok && res.cupon) {
        setAppliedCupon(res.cupon);
      }
    }
  }, [hydrated, bodegaId, cuponesList, subtotal, appliedCupon, cuponInput]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hydrated) return;
    const toPersist: PersistedCart = items.map((item) => ({
      productoId: item.producto.producto_id,
      quantity: item.quantity,
    }));
    const serialized = JSON.stringify(toPersist);
    window.localStorage.setItem(storageKey, serialized);
  }, [items, storageKey, hydrated]);

  useEffect(() => {
    if (!showSuccessBanner) return;
    const timer = window.setTimeout(() => {
      setShowSuccessBanner(false);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [showSuccessBanner]);

  const minimoPedido = bodega.min_pedido_cop ?? 0;
  const faltante = Math.max(0, minimoPedido - subtotal);
  const cumpleMinimo = subtotal >= minimoPedido && subtotal > 0;

  const { discount, couponValidationMsg } = useMemo(() => {
    if (!appliedCupon) return { discount: 0, couponValidationMsg: null };
    // Re-validar al cambiar el subtotal para ajustar el descuento o invalidar si baja del mínimo
    const res = validateCupon(cuponesList, appliedCupon.code, bodegaId, subtotal);
    if (!res.ok) {
      return { discount: 0, couponValidationMsg: res.reason || "Cupón inválido" };
    }
    return { discount: res.descuentoCOP, couponValidationMsg: null };
  }, [appliedCupon, subtotal, cuponesList, bodegaId]);

  const totalFinal = Math.max(0, subtotal - discount);
  const pointsEarned = calcPuntosPedido(productos as any, totalFinal);

  const isFormValid =
    nombre.trim().length > 1 &&
    telefono.trim().length > 3 &&
    direccion.trim().length > 3;

  const hasMetodoPago = metodoPago.trim().length > 0;

  const canSend =
    (productos?.length ?? 0) > 0 &&
    cumpleMinimo &&
    totalFinal > 0 &&
    isFormValid &&
    hasMetodoPago &&
    !isSending;

  const handleApplyCupon = () => {
    setCuponError(null);
    if (!cuponInput.trim()) {
      setAppliedCupon(null);
      return;
    }
    const res = validateCupon(cuponesList, cuponInput, bodegaId, subtotal);
    if (!res.ok) {
      setAppliedCupon(null);
      setCuponError(res.reason || "Cupón inválido");
    } else {
      setAppliedCupon(res.cupon!);
    }
  };

  const handleSubmit = async () => {
    if (!canSend) {
      if (!isFormValid && formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth' });
        // Aquí podrías setear un estado de "touched" para mostrar errores rojos
      }
      return;
    }
    setIsSending(true);
    setStatusMsg(null);
    setSuccessPedidoId(null);

    const pedidoId = buildPedidoId(bodegaId);

    // Generar tracking code corto y único para este pedido
    const trackingCode = `TRK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const payload = {
      id: pedidoId,
      pedidoId,
      trackingCode,
      bodegaId,
      estado: "nuevo",
      metodoPago,
      cliente: {
        nombre,
        telefono,
      },
      direccion,
      zona: bodega.zona,
      items: items.map((line) => ({
        productoId: line.producto.producto_id,
        nombre: line.producto.nombre,
        sku: (line.producto as any).sku,
        precio: line.producto.precio_cop ?? 0,
        precio_cop: line.producto.precio_cop ?? 0,
        cantidad: line.quantity,
        subtotal: (line.producto.precio_cop ?? 0) * line.quantity,
      })),
      total: totalFinal,
      totalOriginal: subtotal,
      discount,
      createdAt: new Date().toISOString(),
      datosEntrega: {
        nombre,
        telefono,
        direccion,
        notas: notas.trim() || null,
      },
      coupon: appliedCupon && discount > 0
        ? { code: appliedCupon.code, descuentoCOP: discount }
        : undefined,
      pointsEarned,
    };

    try {
      const resp = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Error HTTP ${resp.status}`);
      }

      const data = (await resp.json()) as { ok: boolean; pedido?: { pedidoId?: string; id?: string } };
      if (!data.ok) {
        throw new Error("La API no respondio ok");
      }

      // Guardar tendero phone y bodega para "mis pedidos"
      saveTenderoPhone(telefono);
      saveBodegaId(bodegaId);

      clearCart(bodegaId);
      setItems([]);
      const finalId = data.pedido?.pedidoId ?? data.pedido?.id ?? pedidoId;
      setStatusMsg(`Pedido creado: ${finalId}`);
      setSuccessPedidoId(finalId);
      setShowSuccessBanner(true);
    } catch (err: any) {
      console.error(err);
      setStatusMsg(err.message || "Error al enviar el pedido. Intenta de nuevo.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8 pb-24 md:pb-0">
      <StepperNav currentStep="confirmar" />
      {showSuccessBanner && successPedidoId ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Pedido creado: {successPedidoId}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push(`/entregas/${encodeURIComponent(successPedidoId)}`)}
                className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Ver entrega
              </button>
              <button
                type="button"
                onClick={() => setShowSuccessBanner(false)}
                className="rounded-lg border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex items-center gap-3 text-sm text-[color:var(--text-normal)]">
        <Link href="/bodegas" className="text-sky-700 hover:underline">
          Volver a bodegas
        </Link>
        <span>/{bodega.nombre}</span>
      </div>

      <header className="rounded-2xl border border-[color:var(--surface-border)] bg-gradient-to-br from-white via-[color:var(--brand-primary-soft)] to-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-muted)]">
          Confirmación de pedido
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[color:var(--text-strong)]">
          {bodega.nombre}
        </h1>
        <p className="mt-1 text-sm text-[color:var(--text-normal)]">
          Mínimo: {formatCurrency(minimoPedido)} · {bodega.ciudad} · {bodega.zona}
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-[color:var(--surface-border)] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">
                Resumen del pedido
              </h2>
              <span className="text-sm text-[color:var(--text-muted)]">
                {totalItems} item(s)
              </span>
            </div>

            {items.length === 0 ? (
              <div className="mt-3 rounded-lg border border-dashed border-[color:var(--surface-border)] bg-slate-50 px-4 py-3 text-sm text-[color:var(--text-muted)]">
                No hay productos en el carrito para esta bodega.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {items.map((line) => (
                  <div
                    key={line.producto.producto_id}
                    className="rounded-lg border border-[color:var(--surface-border)] p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-[color:var(--text-strong)]">
                          {line.producto.nombre}
                        </div>
                        <div className="text-xs text-[color:var(--text-muted)]">
                          {line.producto.categoria}
                        </div>
                        <div className="text-xs text-[color:var(--text-muted)]">
                          Precio: {formatCurrency(line.producto.precio_cop)}
                        </div>
                      </div>
                      <div className="text-right text-sm text-[color:var(--text-normal)]">
                        x{line.quantity}
                        <div className="font-semibold text-[color:var(--text-strong)]">
                          {formatCurrency(
                            (line.producto.precio_cop ?? 0) * line.quantity,
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 space-y-2 rounded-2xl border border-[color:var(--surface-border)] bg-white px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={cuponInput}
                  onChange={(e) => setCuponInput(e.target.value)}
                  placeholder="Cupón"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
                <button
                  type="button"
                  onClick={handleApplyCupon}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Aplicar
                </button>
              </div>
              {cuponError || couponValidationMsg ? (
                <p className="text-xs text-red-600">{cuponError || couponValidationMsg}</p>
              ) : null}
              {appliedCupon && !couponValidationMsg ? (
                <p className="text-xs text-emerald-700">
                  Cupón {appliedCupon.code} aplicado:{" "}
                  {appliedCupon.type === "percent"
                    ? `${appliedCupon.value}%`
                    : formatCurrency(appliedCupon.value)}
                </p>
              ) : null}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[color:var(--surface-border)] pt-3 text-sm text-[color:var(--text-normal)]">
              <span>Minimo pedido</span>
              <span className="font-semibold text-[color:var(--text-strong)]">
                {formatCurrency(minimoPedido)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-[color:var(--text-normal)]">
              <span>Total</span>
              <span className="text-xl font-semibold text-[color:var(--text-strong)]">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-[color:var(--text-normal)]">
              <span>Descuento</span>
              <span className="text-lg font-semibold text-[color:var(--text-strong)]">
                -{formatCurrency(discount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-[color:var(--text-normal)]">
              <span>Total final</span>
              <span className="text-xl font-semibold text-[color:var(--text-strong)]">
                {formatCurrency(totalFinal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-[color:var(--text-normal)]">
              <span>Puntos estimados</span>
              <span className="font-semibold text-[color:var(--text-strong)]">
                {pointsEarned}
              </span>
            </div>
            {pointsEarned > 0 && (
              <div className="mt-2 text-center text-xs font-medium text-sky-700">
                Puntos estimados por este pedido: {pointsEarned}
              </div>
            )}
            <div className="mt-2 rounded-lg bg-slate-50 px-4 py-3 text-sm text-[color:var(--text-normal)]">
              {cumpleMinimo ? (
                <span className="text-emerald-700">Listo para pedir.</span>
              ) : (
                <span className="text-amber-700">
                  Te faltan {formatCurrency(faltante)} para el minimo.
                </span>
              )}
            </div>
          </div>
        </div>

        <aside ref={formRef} className="rounded-2xl border border-[color:var(--surface-border)] bg-white p-5 shadow-sm h-fit">
          <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">
            Datos de entrega
          </h2>
          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <label className="text-sm text-[color:var(--text-normal)]">Nombre del tendero</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder="Ej: Juan Perez"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-[color:var(--text-normal)]">Telefono</label>
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full rounded-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder="Ej: +57 3001234567"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-[color:var(--text-normal)]">
                Direccion de entrega
              </label>
              <input
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full rounded-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder="Ej: Calle 10 #20-30"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="metodo-pago" className="text-sm text-[color:var(--text-normal)]">
                Metodo de pago
              </label>
              <select
                id="metodo-pago"
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full rounded-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              >
                <option value="contraentrega">Contraentrega</option>
                <option value="transferencia">Transferencia</option>
                <option value="credito_bodega">Crédito bodega</option>
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="notas" className="text-sm text-[color:var(--text-normal)]">
                Notas (opcional)
              </label>
              <textarea
                id="notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                rows={3}
              />
            </div>
          </div>

          {/* Botón Desktop */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSend}
            className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? "Enviando..." : "Realizar pedido"}
          </button>

          {statusMsg ? (
            <div className="mt-3 space-y-2 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-800">
              <div className={successPedidoId ? "text-emerald-700" : "text-red-600"}>{statusMsg}</div>
              <div className="flex flex-wrap gap-3">
                <Link href="/bodegas" className="text-sky-700 hover:underline">
                  Volver a bodegas
                </Link>
                <Link href="/pedidos" className="text-sky-700 hover:underline">
                  Ver mis pedidos
                </Link>
                {successPedidoId ? (
                  <button
                    type="button"
                    onClick={() => router.push(`/entregas/${encodeURIComponent(successPedidoId)}`)}
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Ver entrega
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </aside>
      </section>

      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-4 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Total a pagar</span>
            <span className="text-lg font-bold text-gray-900">{formatCurrency(totalFinal)}</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!canSend}
            className="flex-1 bg-blue-600 text-white text-center py-3 px-4 rounded-lg font-bold text-base hover:bg-blue-700 active:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? "Enviando..." : "Realizar pedido"}
          </button>
        </div>
      </div>
    </div>
  );
}
