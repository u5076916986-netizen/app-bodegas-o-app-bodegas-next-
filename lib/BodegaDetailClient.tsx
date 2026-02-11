"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Bodega, Producto } from "@/lib/csv";
import type { BodegaTheme } from "@/lib/themes";
import { getCartKey } from "@/lib/cartStorage";
import CartFab from "@/components/CartFab";

type BodegaDetailClientProps = {
    bodega: Bodega;
    productos: Producto[];
    theme: BodegaTheme;
};

type CartItem = {
    producto: Producto;
    quantity: number;
};

export default function BodegaDetailClient({
    bodega,
    productos,
    theme,
}: BodegaDetailClientProps) {
    const router = useRouter();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [hydrated, setHydrated] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("Todos");

    // 1. Hidratación del carrito
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

    // 2. Persistencia del carrito
    useEffect(() => {
        if (!hydrated) return;
        const key = getCartKey(bodega.bodega_id);
        window.localStorage.setItem(key, JSON.stringify(cart));
    }, [cart, hydrated, bodega.bodega_id]);

    // Helpers de carrito
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
                p.producto.producto_id === producto.producto_id ? { ...p, quantity: newQty } : p
            );
        });
    };

    const getQty = (id: string) => cart.find((p) => p.producto.producto_id === id)?.quantity || 0;

    const cartTotal = cart.reduce(
        (acc, item) => acc + (item.producto.precio_cop || 0) * item.quantity,
        0
    );
    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    // Filtros y Categorías
    const categories = useMemo(() => {
        const cats = new Set(productos.map((p) => p.categoria).filter(Boolean));
        return ["Todos", ...Array.from(cats)];
    }, [productos]);

    const filteredProducts = useMemo(() => {
        return productos.filter((p) => {
            const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
            const matchCat = selectedCategory === "Todos" || p.categoria === selectedCategory;
            return matchSearch && matchCat;
        });
    }, [productos, searchTerm, selectedCategory]);

    // Estilos dinámicos basados en el tema
    const primaryColor = theme.primary || "#334155";
    const accentColor = theme.accent || "#1d4ed8";

    if (!hydrated) return <div className="min-h-screen bg-white" />;

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            {/* 2.1 Header Compacto + Sticky */}
            <header className="sticky top-0 z-40 bg-white shadow-sm">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                    <button onClick={() => router.back()} className="p-1 -ml-1 text-gray-600">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-bold text-gray-900 truncate">{bodega.nombre}</h1>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            {bodega.min_pedido_cop && (
                                <span className="bg-gray-100 px-1.5 py-0.5 rounded">
                                    Min: ${bodega.min_pedido_cop.toLocaleString("es-CO")}
                                </span>
                            )}
                            <span className="text-green-600 font-medium">Abierto</span>
                        </div>
                    </div>
                </div>

                {/* Buscador y Categorías */}
                <div className="px-4 py-2 bg-white space-y-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            className="w-full bg-gray-100 text-gray-900 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <svg
                            className="absolute left-3 top-2.5 text-gray-400 w-4 h-4"
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
                                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${selectedCategory === cat
                                        ? "text-white"
                                        : "bg-gray-100 text-gray-600"
                                    }`}
                                style={{
                                    backgroundColor: selectedCategory === cat ? primaryColor : undefined,
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="px-4 py-4 space-y-6">
                {/* 2.3 Sección Cupones y Promociones */}
                <section className="space-y-3">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-3 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-blue-800">Cupones disponibles</p>
                            <p className="text-xs text-blue-600">Ahorra en tu pedido hoy</p>
                        </div>
                        <span className="text-2xl">🎟️</span>
                    </div>

                    {/* AdSlot Placeholder */}
                    <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-center">
                        <p className="text-xs font-bold text-yellow-800 uppercase tracking-wide">Promos para ti</p>
                        <p className="text-sm text-yellow-900 mt-1">¡Envío gratis por compras superiores a $100.000!</p>
                    </div>
                </section>

                {/* 2.2 Catálogo */}
                <section>
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                        Productos ({filteredProducts.length})
                    </h2>

                    <div className="grid grid-cols-1 gap-4">
                        {filteredProducts.map((p) => {
                            const qty = getQty(p.producto_id);
                            return (
                                <div
                                    key={p.producto_id}
                                    className="bg-white rounded-xl border border-gray-100 p-3 flex gap-4 shadow-sm"
                                >
                                    {/* Imagen */}
                                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                        {p.imagen_url ? (
                                            <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                                    <polyline points="21 15 16 10 5 21" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info + Controles */}
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-medium text-gray-900 leading-tight mb-1">{p.nombre}</h3>
                                            <p className="text-xs text-gray-500">{p.unidad}</p>
                                        </div>

                                        <div className="flex items-end justify-between mt-2">
                                            <span className="font-bold text-gray-900">
                                                ${p.precio_cop?.toLocaleString("es-CO") ?? "0"}
                                            </span>

                                            {qty === 0 ? (
                                                <button
                                                    onClick={() => updateQty(p, 1)}
                                                    className="px-3 py-1.5 rounded-lg text-sm font-bold text-white shadow-sm active:scale-95 transition-transform"
                                                    style={{ backgroundColor: accentColor }}
                                                >
                                                    + Agregar
                                                </button>
                                            ) : (
                                                <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                                                    <button
                                                        onClick={() => updateQty(p, -1)}
                                                        className="w-8 h-8 flex items-center justify-center text-gray-600 font-bold active:bg-gray-200 rounded"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="w-8 text-center font-bold text-gray-900 text-sm">{qty}</span>
                                                    <button
                                                        onClick={() => updateQty(p, 1)}
                                                        className="w-8 h-8 flex items-center justify-center text-gray-600 font-bold active:bg-gray-200 rounded"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>

            {/* 3.1 Barra Inferior / Floating Button */}
            <CartFab bodegaId={bodega.bodega_id} count={cartCount} subtotal={cartTotal} />
        </div>
    );
}