"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Bodega, Producto } from "@/lib/csv";
import type { BodegaTheme } from "@/lib/themes";
import { getCartKey } from "@/lib/cartStorage";
import CartFab from "@/components/CartFab";
import CuponesDisponibles from "@/components/CuponesDisponibles";
import AdSlot from "@/components/AdSlot";
import { buildFuseIndex, smartSearch } from "@/lib/smartSearch";
import { expandQuery } from "@/lib/synonyms";

type BodegaDetailClientProps = {
  bodega: Bodega;
  productos: Producto[];
  theme: BodegaTheme;
};

type CartItem = {
  producto: Producto;
  quantity: number;
};

export default function BodegaDetailClient({ bodega, productos, theme }: BodegaDetailClientProps) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");

  useEffect(() => {
    const key = getCartKey(bodega.bodega_id);
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCart(parsed);
        }
      }
    } catch (e) {
      console.error("Error loading cart", e);
    }
    setHydrated(true);
  }, [bodega.bodega_id]);

  useEffect(() => {
    if (!hydrated) return;
    const key = getCartKey(bodega.bodega_id);
    window.localStorage.setItem(key, JSON.stringify(cart));
  }, [cart, hydrated, bodega.bodega_id]);

  const updateQty = (producto: Producto, delta: number) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.producto.producto_id === producto.producto_id);
      if (!existing) {
        if (delta > 0) return [...prev, { producto, quantity: delta }];
        return prev;
      }
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((p) => p.producto.producto_id !== producto.producto_id);
      }
      return prev.map((p) =>
        p.producto.producto_id === producto.producto_id ? { ...p, quantity: newQty } : p,
      );
    });
  };

  const getQty = (id: string) => cart.find((p) => p.producto.producto_id === id)?.quantity || 0;
  const cartTotal = cart.reduce(
    (acc, item) => acc + (item.producto.precio_cop || 0) * item.quantity,
    0,
  );
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const categories = useMemo(() => {
    const cats = new Set(productos.map((p) => p.categoria).filter(Boolean));
    return ["Todos", ...Array.from(cats)];
  }, [productos]);

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

  const filteredProducts = useMemo(() => {
    let filtered = productos;
    if (searchTerm.trim()) {
      const expanded = expandQuery(searchTerm);
      filtered = smartSearch(fuse, expanded, 200) as Producto[];
    }
    if (selectedCategory !== "Todos") {
      filtered = filtered.filter((p) => p.categoria === selectedCategory);
    }
    return filtered;
  }, [productos, searchTerm, selectedCategory, fuse]);

  const primaryColor = theme.primary || "#334155";

  if (!hydrated) return <div className="min-h-screen bg-gray-50" />;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <button
            onClick={() => router.back()}
            className="rounded-full border border-gray-200 p-1 text-gray-600 hover:text-gray-800"
          >
            <span className="sr-only">Volver</span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 truncate">{bodega.nombre}</h1>
              {bodega.min_pedido_cop ? (
                <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                  Mínimo ${bodega.min_pedido_cop.toLocaleString("es-CO")}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-gray-500">Compra rápido desde tu móvil.</p>
          </div>
          <Link
            href={`/bodegas/${bodega.bodega_id}/cupones`}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--brand-primary)] text-center"
          >
            Mis cupones
          </Link>
        </div>
        <div className="px-4 py-3 border-b border-gray-100 bg-white space-y-2">
          <div className="relative">
            <input
              type="text"
              placeholder="¿Qué buscas hoy?"
              className="w-full bg-gray-100 text-gray-900 rounded-2xl pl-11 pr-4 py-3 text-base font-medium focus:ring-2 focus:ring-[color:var(--brand-primary)] outline-none shadow-sm placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute left-4 top-3.5 text-gray-400 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${selectedCategory === cat ? "text-white bg-[color:var(--brand-primary)]" : "bg-gray-100 text-gray-600"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-5">
        <section className="rounded-2xl border border-[color:var(--surface-border)] bg-white p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-[color:var(--text-muted)]">Resumen</p>
            <span className="text-xs font-semibold text-green-600">Abierto</span>
          </div>
          <p className="text-lg font-semibold text-[color:var(--text-strong)]">
            Mínimo ${bodega.min_pedido_cop?.toLocaleString("es-CO")}
          </p>
          <p className="text-sm text-[color:var(--text-normal)]">
            Agrega productos y avanza al checkout con un solo toque.
          </p>
        </section>

        <section className="rounded-2xl border border-[color:var(--surface-border)] bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-muted)]">Promociones</p>
              <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">AdSlot</h2>
            </div>
            <span className="text-xs font-semibold text-[color:var(--text-normal)]">Solo hoy</span>
          </div>
          <AdSlot placement="catalogo" bodegaId={bodega.bodega_id} />
        </section>

        <section className="rounded-2xl border border-[color:var(--surface-border)] bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-[color:var(--text-muted)]">Cupones disponibles</p>
            <Link href={`/bodegas/${bodega.bodega_id}/cupones`} className="text-xs font-semibold text-[color:var(--brand-primary)] hover:underline">
              Ver todos
            </Link>
          </div>
          <CuponesDisponibles bodegaId={bodega.bodega_id} />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
              Catálogo ({filteredProducts.length})
            </h2>
            <p className="text-xs font-medium text-[color:var(--text-normal)]">
              {cartCount} item(s) en carrito
            </p>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[color:var(--surface-border)] bg-white p-6 text-center text-sm text-[color:var(--text-muted)] space-y-3">
              <p>No se encontraron productos.</p>
              <Link href="/bodegas" className="text-sm font-semibold text-[color:var(--brand-primary)] hover:underline">
                Volver a bodegas
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((p) => {
                const qty = getQty(p.producto_id);
                return (
                  <div
                    key={p.producto_id}
                    className="rounded-2xl border border-[color:var(--surface-border)] bg-white p-4 shadow-sm flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold text-[color:var(--text-strong)] leading-tight line-clamp-2">
                        {p.nombre}
                      </h3>
                      <p className="text-sm text-[color:var(--text-muted)]">
                        {p.unidad ?? "Unidad"} · Stock {p.stock ?? "N/D"}
                      </p>
                      <p className="text-2xl font-bold text-[color:var(--text-strong)]">
                        ${p.precio_cop?.toLocaleString("es-CO") ?? "0"}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      {qty === 0 ? (
                        <button
                          onClick={() => updateQty(p, 1)}
                          className="flex-1 h-11 rounded-2xl bg-[color:var(--brand-primary)] text-white font-semibold text-sm uppercase tracking-wide shadow-sm hover:opacity-90 transition"
                        >
                          Agregar
                        </button>
                      ) : (
                        <div className="flex items-center justify-between rounded-2xl border border-[color:var(--surface-border)] px-1 py-1.5">
                          <button
                            onClick={() => updateQty(p, -1)}
                            className="h-10 w-10 rounded-lg text-lg font-bold text-[color:var(--text-normal)] hover:bg-gray-100 transition"
                          >
                            –
                          </button>
                          <span className="text-base font-semibold text-[color:var(--text-strong)]">{qty}</span>
                          <button
                            onClick={() => updateQty(p, 1)}
                            className="h-10 w-10 rounded-lg text-lg font-bold text-[color:var(--text-normal)] hover:bg-gray-100 transition"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 bg-white px-4 py-3 shadow-[0_-12px_20px_rgba(15,15,15,0.08)] md:hidden">
          <div>
            <p className="text-xs uppercase tracking-wide text-[color:var(--text-muted)]">Items</p>
            <p className="text-lg font-semibold text-[color:var(--text-strong)]">{cartCount}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[color:var(--text-muted)]">Total</p>
            <p className="text-lg font-semibold text-[color:var(--text-strong)]">
              ${cartTotal.toLocaleString("es-CO")}
            </p>
          </div>
          <Link
            href={`/pedido/confirmar?bodegaId=${bodega.bodega_id}`}
            className="flex-1 rounded-2xl bg-[color:var(--brand-primary)] py-3 text-center text-sm font-semibold uppercase text-white shadow-lg hover:opacity-90 transition"
          >
            Ir a pagar
          </Link>
        </div>
      )}

      <CartFab bodegaId={bodega.bodega_id} count={cartCount} subtotal={cartTotal} />
    </div>
  );
}
