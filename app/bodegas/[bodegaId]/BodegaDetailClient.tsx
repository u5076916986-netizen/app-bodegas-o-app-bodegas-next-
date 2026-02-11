"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Bodega, Producto } from "@/lib/csv";
import { getCartKey } from "@/lib/cartStorage";
import type { BodegaTheme } from "@/lib/themes";
import AdSlot from "@/components/AdSlot";
import CuponesDisponibles from "@/components/CuponesDisponibles";
import ProductQuickModal from "@/components/ProductQuickModal";
import CarritoDrawer from "@/app/(tendero)/carrito/CarritoDrawer";
import { useCart } from "@/app/providers";
import { saveBodegaId, saveTenderoPhone } from "@/lib/storage";
import { clearCart, getCart, saveCart, setActiveBodega } from "@/lib/cart";
import { saveCatalogSnapshot } from "@/lib/catalogStorage";
import TenderoNotifications from "@/components/TenderoNotifications";
import StepperNav from "@/components/StepperNav";
import { buildFuseIndex, smartSearch } from "@/lib/smartSearch";
import { expandQuery } from "@/lib/synonyms";

type CartLine = {
  producto: Producto;
  quantity: number;
};

type PersistedCart = {
  productoId: string;
  quantity: number;
}[];

type Props = {
  bodega: Bodega;
  productos: Producto[];
  theme: BodegaTheme;
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

export default function BodegaDetailClient({ bodega, productos, theme }: Props) {
  const router = useRouter();
  const {
    items: globalItems,
    addItem: addItemGlobal,
    setQty: setQtyGlobal,
    removeItem: removeItemGlobal,
  } = useCart();
  const [items, setItems] = useState<CartLine[]>([]);
  const [debugRaw, setDebugRaw] = useState<string | null>(null);
  const [missingCount, setMissingCount] = useState(0);
  const [zeroPriceCount, setZeroPriceCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("TODOS");
  const [selectedProductForModal, setSelectedProductForModal] = useState<Producto | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [catalogMounted, setCatalogMounted] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [pagoConfirmado, setPagoConfirmado] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [successPedidoId, setSuccessPedidoId] = useState<string | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const storageKey = getCartKey(bodega.bodega_id);

  useEffect(() => {
    setCatalogMounted(true);
  }, []);

  useEffect(() => {
    // open quick modal when URL contains ?highlight=PRODUCT_ID
    try {
      const sp = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const highlight = sp?.get("highlight");
      if (highlight) {
        const found = productos.find((p) => p.producto_id === highlight);
        if (found) setSelectedProductForModal(found);
      }
    } catch (err) {
      // ignore
    }

    if (typeof window === "undefined") return;
    const persisted = getCart(bodega.bodega_id);
    setDebugRaw(persisted.length > 0 ? JSON.stringify(persisted) : null);
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
      let zeroPrice = 0;
      const hydratedItems: CartLine[] = parsed
        .map(({ productoId, quantity }) => {
          const producto = productos.find(
            (p) => p.producto_id === productoId,
          );
          if (!producto) {
            missing += 1;
            return null;
          }
          if (producto.precio_cop === null || !Number.isFinite(producto.precio_cop)) {
            zeroPrice += 1;
          }
          return { producto, quantity: Math.max(1, quantity) };
        })
        .filter(Boolean) as CartLine[];
      setMissingCount(missing);
      setZeroPriceCount(zeroPrice);
      setItems(hydratedItems);
    } catch (err) {
      console.warn("No se pudo leer el carrito desde localStorage", err);
      setMissingCount(0);
      setZeroPriceCount(0);
    } finally {
      setHydrated(true);
    }
  }, [storageKey, productos]);

  useEffect(() => {
    if (!globalItems || globalItems.length === 0) {
      if (items.length !== 0) setItems([]);
      return;
    }
    const byId = new Map(productos.map((p) => [p.producto_id, p] as const));
    const nextItems = globalItems
      .filter((item) => item.bodegaId === bodega.bodega_id)
      .map((item) => {
        const producto = byId.get(item.productId);
        if (!producto) return null;
        return { producto, quantity: item.qty };
      })
      .filter(Boolean) as CartLine[];

    const sameLength = nextItems.length === items.length;
    const sameQuantities = sameLength
      ? nextItems.every((next) => {
        const current = items.find((line) => line.producto.producto_id === next.producto.producto_id);
        return current?.quantity === next.quantity;
      })
      : false;

    if (!sameQuantities) {
      setItems(nextItems);
    }
  }, [globalItems, productos, bodega.bodega_id, items.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const snapshot = productos.map((producto) => ({
      id: producto.producto_id,
      bodegaId: bodega.bodega_id,
      nombre: producto.nombre,
      categoria: producto.categoria,
      precio_cop: producto.precio_cop ?? producto.precio ?? 0,
      precio: producto.precio ?? producto.precio_cop ?? 0,
      stock: producto.stock,
      activo: producto.activo,
      sku: (producto as any).sku,
    }));
    saveCatalogSnapshot(bodega.bodega_id, snapshot);
  }, [productos, bodega.bodega_id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hydrated) return;
    const toPersist: PersistedCart = items.map((item) => ({
      productoId: item.producto.producto_id,
      quantity: item.quantity,
    }));
    saveCart(bodega.bodega_id, toPersist);
    setActiveBodega(bodega.bodega_id);
    setDebugRaw(JSON.stringify(toPersist));
  }, [items, storageKey, hydrated, bodega.bodega_id]);

  useEffect(() => {
    if (!showSuccessBanner) return;
    const timer = window.setTimeout(() => {
      setShowSuccessBanner(false);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [showSuccessBanner]);

  const addToCart = (producto: Producto) => {
    addItemGlobal(
      {
        productId: producto.producto_id,
        name: producto.nombre,
        price: Number(producto.precio_cop ?? producto.precio ?? 0),
        imageUrl: (producto as any).imagen_url,
        bodegaId: bodega.bodega_id,
      },
      1,
    );
    setItems((prev) => {
      const existing = prev.find(
        (line) => line.producto.producto_id === producto.producto_id,
      );
      if (existing) {
        return prev.map((line) =>
          line.producto.producto_id === producto.producto_id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [...prev, { producto, quantity: 1 }];
    });
  };

  const changeQuantity = (productoId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((line) =>
          line.producto.producto_id === productoId
            ? { ...line, quantity: line.quantity + delta }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
    const current = items.find((line) => line.producto.producto_id === productoId)?.quantity ?? 0;
    const nextQty = Math.max(1, current + delta);
    if (nextQty <= 0) {
      removeItemGlobal(productoId);
    } else {
      setQtyGlobal(productoId, nextQty);
    }
  };

  const removeItem = (productoId: string) => {
    setItems((prev) =>
      prev.filter((line) => line.producto.producto_id !== productoId),
    );
    removeItemGlobal(productoId);
  };

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

  const minimoPedido = bodega.min_pedido_cop ?? 0;
  const faltante = Math.max(0, minimoPedido - subtotal);
  const cumpleMinimo = subtotal >= minimoPedido && subtotal > 0;
  const isFormValid =
    nombre.trim().length > 1 && telefono.trim().length > 3 && direccion.trim().length > 3;

  const logoToShow = theme.logo ?? bodega.logo_url;
  const { fuse } = useMemo(
    () =>
      buildFuseIndex(
        productos.map((p) => ({
          ...p,
          sku: p.producto_id,
          presentacion: p.unidad,
          tags: [],
        })),
      ),
    [productos],
  );

  // Extrae categorías únicas y las ordena
  const categories = useMemo(() => {
    const cats = Array.from(new Set(productos.map((p) => p.categoria || "SIN CATEGORÍA")));
    return ["TODOS", ...cats.sort()];
  }, [productos]);

  // Filtra y ordena productos: destacados primero, luego por búsqueda y categoría
  const filteredProducts = useMemo(() => {
    let filtered = productos;

    if (searchTerm.trim()) {
      const expanded = expandQuery(searchTerm);
      filtered = smartSearch(fuse, expanded, 200) as Producto[];
    }

    if (selectedCategory !== "TODOS") {
      filtered = filtered.filter((p) => p.categoria === selectedCategory);
    }

    // Ordenar: stock alto primero (destacados), luego por precio
    return filtered.sort((a, b) => {
      const stockDiff = (b.stock ?? 0) - (a.stock ?? 0);
      if (stockDiff !== 0) return stockDiff;
      return (a.precio_cop ?? 0) - (b.precio_cop ?? 0);
    });
  }, [productos, selectedCategory, searchTerm, fuse]);

  const handleConfirmPedido = async () => {
    if (isSending) return;
    if (!cumpleMinimo || !isFormValid || items.length === 0 || !pagoConfirmado) {
      setStatusMsg("Completa nombre, teléfono, dirección y confirma el pago antes de continuar.");
      return;
    }

    setIsSending(true);
    setStatusMsg(null);
    setSuccessPedidoId(null);

    const pedidoId = buildPedidoId(bodega.bodega_id);
    const payload = {
      id: pedidoId,
      pedidoId,
      bodegaId: bodega.bodega_id,
      estado: "nuevo",
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
      total: subtotal,
      createdAt: new Date().toISOString(),
      datosEntrega: {
        nombre,
        telefono,
        direccion,
        notas: null,
      },
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

      const finalId = data.pedido?.pedidoId ?? data.pedido?.id ?? pedidoId;
      saveTenderoPhone(telefono);
      saveBodegaId(bodega.bodega_id);
      clearCart(bodega.bodega_id);
      setItems([]);
      setStatusMsg(`Pedido creado: ${finalId}`);
      setSuccessPedidoId(finalId);
      setShowSuccessBanner(true);
      setPagoConfirmado(false);
    } catch (err: any) {
      console.error(err);
      setStatusMsg(err.message || "Error al crear el pedido. Intenta de nuevo.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl space-y-10 p-6">
      <StepperNav currentStep="bodegas" />
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
      <div className="flex flex-wrap items-center gap-3 text-sm text-[color:var(--text-normal)]">
        <Link
          href="/bodegas"
          className="text-[color:var(--brand-accent)] hover:underline"
        >
          Volver a bodegas
        </Link>
        <Link
          href={`/bodegas/${bodega.bodega_id}/cupones`}
          className="rounded-full border border-[color:var(--surface-border)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--brand-accent)] transition hover:bg-[color:var(--surface-border)]"
        >
          Cupones
        </Link>
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="rounded-full border border-[color:var(--surface-border)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--brand-accent)] transition hover:bg-[color:var(--surface-border)]"
        >
          Carrito ({totalItems})
        </button>
        <span>/{bodega.nombre}</span>
      </div>

      <section className="rounded-2xl border border-[color:var(--surface-border)] bg-gradient-to-br from-white via-[color:var(--brand-primary-soft)] to-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-muted)]">
              Compra rápida y segura
            </p>
            <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">
              {bodega.nombre}
            </h1>
            <p className="text-sm text-[color:var(--text-normal)]">
              {bodega.ciudad} · {bodega.zona} · Entrega estimada {bodega.tiempo_entrega_estimado}
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm ring-1 ring-[color:var(--surface-border)]">
            <p className="text-xs text-[color:var(--text-muted)]">Mínimo de pedido</p>
            <p className="text-lg font-semibold text-[color:var(--text-strong)]">
              {formatCurrency(bodega.min_pedido_cop)}
            </p>
          </div>
        </div>
      </section>

      {process.env.NODE_ENV === "development" ? (
        <div className="rounded-md bg-slate-100 px-3 py-2 text-xs text-[color:var(--text-normal)]">
          <div>Debug dev</div>
          <div>Bodega: {bodega.bodega_id}</div>
          <div>Key: {storageKey}</div>
          <div>Items: {items.length}</div>
          <div>Subtotal: {formatCurrency(subtotal)}</div>
          <div>Minimo: {formatCurrency(minimoPedido)}</div>
          <div>Raw: {debugRaw ?? "null"}</div>
          {missingCount > 0 ? (
            <div className="text-red-600">
              Advertencia: {missingCount} item(s) sin producto en CSV omitidos.
            </div>
          ) : null}
          {zeroPriceCount > 0 ? (
            <div className="text-amber-700">
              Advertencia: {zeroPriceCount} item(s) con precio nulo/0.
            </div>
          ) : null}
        </div>
      ) : null}

      <TenderoNotifications />

      <section className="space-y-4">
        <div className="rounded-2xl border border-[color:var(--surface-border)] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 text-[color:var(--text-normal)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-[color:var(--text-muted)]">
                Promociones
              </p>
              <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">
                Descubre lo nuevo para esta bodega
              </h2>
            </div>
            <span className="text-xs uppercase tracking-wide text-[color:var(--text-normal)]">
              Actualizado regularmente
            </span>
          </div>
          <div className="mt-4">
            <AdSlot placement="catalogo" bodegaId={bodega.bodega_id} />
          </div>
        </div>
        <CuponesDisponibles bodegaId={bodega.bodega_id} />
      </section>

      <section className="rounded-2xl border border-[color:var(--brand-accent)] bg-[color:var(--surface-card)] p-6 shadow-sm">
        <div className="flex flex-wrap items-start gap-4">
          {logoToShow ? (
            <img
              src={logoToShow}
              alt={`Logo ${bodega.nombre}`}
              className="h-16 w-16 rounded-lg border border-[color:var(--surface-border)] bg-white object-contain"
            />
          ) : null}
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-[color:var(--text-muted)]">
              {bodega.categoria_principal}
            </p>
            <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">
              {bodega.nombre}
            </h1>
            <div className="text-sm text-[color:var(--text-normal)]">
              {bodega.ciudad} - {bodega.zona}
            </div>
            <div className="inline-block rounded-full border border-[color:var(--brand-accent)] bg-[color:var(--brand-primary-soft)] px-2 py-0.5 text-xs font-semibold text-[color:var(--brand-accent)]">
              {bodega.estado}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="text-sm text-[color:var(--text-normal)]">
            <span className="font-semibold text-[color:var(--text-strong)]">Bodega ID:</span>{" "}
            {bodega.bodega_id}
          </div>
          <div className="text-sm text-[color:var(--text-normal)]">
            <span className="font-semibold text-[color:var(--text-strong)]">Correo pedidos:</span>{" "}
            {bodega.correo_pedidos}
          </div>
          <div className="text-sm text-[color:var(--text-normal)]">
            <span className="font-semibold text-[color:var(--text-strong)]">Telefono:</span>{" "}
            {bodega.telefono}
          </div>
          <div className="text-sm text-[color:var(--text-normal)]">
            <span className="font-semibold text-[color:var(--text-strong)]">Direccion:</span>{" "}
            {bodega.direccion}
          </div>
          <div className="text-sm text-[color:var(--text-normal)]">
            <span className="font-semibold text-[color:var(--text-strong)]">Horario:</span>{" "}
            {bodega.horario_texto}
          </div>
          <div className="text-sm text-[color:var(--text-normal)]">
            <span className="font-semibold text-[color:var(--text-strong)]">Metodos de pago:</span>{" "}
            {bodega.metodos_pago}
          </div>
          <div className="text-sm text-[color:var(--text-normal)]">
            <span className="font-semibold text-[color:var(--text-strong)]">Minimo pedido:</span>{" "}
            {formatCurrency(bodega.min_pedido_cop)}
          </div>
          <div className="text-sm text-[color:var(--text-normal)]">
            <span className="font-semibold text-[color:var(--text-strong)]">
              Tiempo estimado de entrega:
            </span>{" "}
            {bodega.tiempo_entrega_estimado}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Productos de la bodega
            </h2>
            <p className="text-sm text-slate-600">
              {filteredProducts.length} producto(s) disponible(s)
            </p>
          </div>

          {productos.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Esta bodega no tiene productos registrados.
            </div>
          ) : !catalogMounted ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[color:var(--surface-border)] bg-white p-4 shadow-sm"
                >
                  <div className="h-3 w-24 rounded bg-slate-100" />
                  <div className="mt-2 h-4 w-32 rounded bg-slate-200" />
                  <div className="mt-3 h-3 w-28 rounded bg-slate-100" />
                  <div className="mt-4 h-9 w-full rounded-full bg-slate-200" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Búsqueda y filtros */}
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="🔍 Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-accent)]"
                />

                {/* Categorías tabs */}
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setSearchTerm("");
                      }}
                      className={`rounded-full px-3 py-1 text-sm font-semibold transition ${selectedCategory === cat
                        ? "bg-[color:var(--brand-accent)] text-white"
                        : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resultados */}
              {filteredProducts.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  No se encontraron productos. Intenta con otro término o categoría.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredProducts.map((producto) => (
                    <div
                      key={producto.producto_id}
                      className="group relative rounded-2xl border border-[color:var(--surface-border)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      {/* Badge de stock alto */}
                      {(producto.stock ?? 0) > 100 && (
                        <div className="absolute right-2 top-2 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                          🔥 Oferta
                        </div>
                      )}

                      <div className="text-xs uppercase tracking-wide text-[color:var(--text-muted)]">
                        {producto.categoria}
                      </div>
                      <h3 className="mt-1 text-lg font-semibold text-[color:var(--text-strong)]">
                        {producto.nombre}
                      </h3>
                      <div className="mt-2 text-sm text-[color:var(--text-normal)]">
                        Precio: {formatCurrency(producto.precio_cop)}
                      </div>
                      <div className="mt-1 text-sm text-[color:var(--text-muted)]">
                        Stock: {producto.stock ?? "N/D"} | {producto.unidad}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => addToCart(producto)}
                          className="flex-1 rounded-full bg-[color:var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                        >
                          + Agregar
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedProductForModal(producto)}
                          className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          👁️ Ver
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <aside className="rounded-2xl border border-[color:var(--surface-border)] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--text-strong)]">Mi pedido</h3>
              <p className="text-sm text-[color:var(--text-muted)]">
                {totalItems} item(s) - Minimo {formatCurrency(minimoPedido)}
              </p>
            </div>
            <div className="text-right text-sm text-[color:var(--text-muted)]">
              Subtotal{" "}
              <span className="block text-xl font-semibold text-[color:var(--text-strong)]">
                {formatCurrency(subtotal)}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[color:var(--surface-border)] bg-slate-50 px-4 py-3 text-sm text-[color:var(--text-muted)]">
                Aun no agregas productos.
              </div>
            ) : (
              items.map((line) => (
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
                        {line.producto.categoria} -{" "}
                        {formatCurrency(line.producto.precio_cop)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        removeItem(line.producto.producto_id)
                      }
                      className="text-xs text-slate-500 hover:text-red-600"
                    >
                      Eliminar
                    </button>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          changeQuantity(line.producto.producto_id, -1)
                        }
                        className="h-8 w-8 rounded border border-slate-200 text-lg leading-none text-slate-700 hover:bg-slate-50"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm text-slate-900">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          changeQuantity(line.producto.producto_id, 1)
                        }
                        className="h-8 w-8 rounded border border-slate-200 text-lg leading-none text-slate-700 hover:bg-slate-50"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-sm font-semibold text-[color:var(--text-strong)]">
                      {formatCurrency(
                        (line.producto.precio_cop ?? 0) * line.quantity,
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-[color:var(--text-normal)]">
            {cumpleMinimo ? (
              <span className="text-emerald-700">Listo para pedir.</span>
            ) : (
              <span className="text-amber-700">
                Te faltan {formatCurrency(faltante)} para el minimo.
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className={`mt-4 block w-full rounded-lg px-4 py-2 text-center text-sm font-semibold transition ${cumpleMinimo
              ? "bg-[color:var(--brand-primary)] text-white hover:opacity-90"
              : "cursor-not-allowed bg-slate-300 text-slate-600"
              }`}
            disabled={!cumpleMinimo}
          >
            Confirmar pedido
          </button>
        </aside>
      </section>

      {totalItems > 0 ? (
        <div className="fixed bottom-4 left-1/2 z-40 w-[min(90vw,360px)] -translate-x-1/2">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-slate-800"
          >
            Ver carrito ({totalItems})
          </button>
        </div>
      ) : null}

      {/* Modal de detalles rápido */}
      {selectedProductForModal && (
        <ProductQuickModal
          producto={selectedProductForModal}
          onClose={() => setSelectedProductForModal(null)}
          onAddToCart={(cantidad) => {
            for (let i = 0; i < cantidad; i++) {
              addToCart(selectedProductForModal);
            }
            setSelectedProductForModal(null);
          }}
          formatCurrency={formatCurrency}
        />
      )}

      <CarritoDrawer
        isOpen={isCartOpen}
        bodegaId={bodega.bodega_id}
        bodegaNombre={bodega.nombre}
        minimoPedido={bodega.min_pedido_cop}
        items={items}
        subtotal={subtotal}
        catalogo={productos}
        nombre={nombre}
        telefono={telefono}
        direccion={direccion}
        pagoConfirmado={pagoConfirmado}
        isFormValid={isFormValid}
        statusMsg={statusMsg}
        isSending={isSending}
        successPedidoId={successPedidoId}
        onClose={() => {
          setIsCartOpen(false);
          setPagoConfirmado(false);
        }}
        onChangeNombre={setNombre}
        onChangeTelefono={setTelefono}
        onChangeDireccion={setDireccion}
        onTogglePagoConfirmado={setPagoConfirmado}
        onChangeQuantity={changeQuantity}
        onAddProduct={(producto) => addToCart(producto)}
        onViewEntrega={(pedidoId) => {
          setIsCartOpen(false);
          setPagoConfirmado(false);
          router.push(`/entregas/${encodeURIComponent(pedidoId)}`);
        }}
        formatCurrency={formatCurrency}
      />
    </main>
  );
}
