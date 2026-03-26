"use client";

import { useEffect, useState } from "react";
import ProductDrawer from "@/components/ProductDrawer";
import CartDrawer from "@/components/CartDrawer";
import type { Producto } from "@/components/ProductosClient";
import { FaShoppingCart } from "react-icons/fa";

const CART_KEY = "cart_tendero";

function loadCart(): { producto: Producto; cantidad: number }[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(CART_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveCart(cart: { producto: Producto; cantidad: number }[]) {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {}
}

export default function ProductosTendero() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<Producto | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [cart, setCart] = useState<{ producto: Producto; cantidad: number }[]>([]);

    // Cargar carrito desde localStorage al montar
    useEffect(() => {
        setCart(loadCart());
    }, []);

    // Persistir carrito en localStorage cuando cambia
    useEffect(() => {
        saveCart(cart);
    }, [cart]);

    useEffect(() => {
        async function fetchProductos() {
            setLoading(true);
            try {
                const bodegaRes = await fetch("/api/bodegas/activa");
                const bodegaData = await bodegaRes.json();
                if (!bodegaData.ok) {
                    setError("No se encontró bodega activa");
                    return;
                }
                const res = await fetch(`/api/productos?bodegaId=${bodegaData.bodegaId}`);
                const data = await res.json();
                if (data.ok) setProductos(data.data);
                else setError(data.error || "Error cargando productos");
            } catch {
                setError("Error cargando productos");
            } finally {
                setLoading(false);
            }
        }
        fetchProductos();
    }, []);

    const handleSelect = (producto: Producto) => {
        setSelected(producto);
        setDrawerOpen(true);
    };

    const handleAddToCart = (producto: Producto, cantidad: number) => {
        setCart((prev) => {
            const idx = prev.findIndex((item) => item.producto.id === producto.id);
            if (idx >= 0) {
                const updated = [...prev];
                updated[idx].cantidad = Math.min(producto.stock, updated[idx].cantidad + cantidad);
                return updated;
            }
            return [...prev, { producto, cantidad }];
        });
        setDrawerOpen(false);
    };

    const handleRemove = (productoId: string) => {
        setCart((prev) => prev.filter((item) => item.producto.id !== productoId));
    };

    const handleUpdate = (productoId: string, cantidad: number) => {
        setCart((prev) => prev.map((item) => item.producto.id === productoId ? { ...item, cantidad } : item));
    };

    const handleClear = () => {
        setCart([]);
    };

    const handleCheckout = () => {
        window.location.href = "/tendero/checkout";
    };

    return (
        <div>
            {/* Header con carrito */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Catálogo de productos</h1>
                <button
                    className="relative"
                    onClick={() => setCartOpen(true)}
                    aria-label="Ver carrito"
                >
                    <FaShoppingCart className="text-2xl text-blue-700" />
                    {cart.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                            {cart.reduce((sum, item) => sum + item.cantidad, 0)}
                        </span>
                    )}
                </button>
            </div>
            {/* Listado de productos */}
            {loading ? (
                <div className="text-center py-12 text-slate-500">Cargando productos...</div>
            ) : error ? (
                <div className="text-center text-red-600">{error}</div>
            ) : productos.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No hay productos disponibles.</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {productos.map((producto) => (
                        <div
                            key={producto.id}
                            className="bg-white rounded-lg shadow hover:shadow-lg p-4 cursor-pointer flex flex-col items-center"
                            onClick={() => handleSelect(producto)}
                        >
                            <img
                                src={producto.imagenUrl || "/productos/placeholder.svg"}
                                alt={producto.nombre}
                                className="w-24 h-24 object-contain mb-2 bg-slate-100 rounded"
                            />
                            <div className="font-semibold text-center mb-1">{producto.nombre}</div>
                            <div className="text-blue-700 font-bold mb-1">${producto.precio.toLocaleString("es-CO")}</div>
                            <div className="text-xs text-gray-500">Stock: {producto.stock}</div>
                        </div>
                    ))}
                </div>
            )}
            {/* Drawer de producto */}
            <ProductDrawer
                producto={selected as Producto}
                isOpen={drawerOpen && !!selected}
                onClose={() => setDrawerOpen(false)}
                onAddToCart={handleAddToCart}
            />
            {/* Drawer de carrito */}
            <CartDrawer
                isOpen={cartOpen}
                items={cart}
                onClose={() => setCartOpen(false)}
                onRemove={handleRemove}
                onUpdate={handleUpdate}
                onCheckout={handleCheckout}
                onClear={handleClear}
            />
        </div>
    );
}
