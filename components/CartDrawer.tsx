"use client";

import type { Producto } from "@/components/ProductosClient";

interface CartItem {
    producto: Producto;
    cantidad: number;
}

interface CartDrawerProps {
    isOpen: boolean;
    items: CartItem[];
    onClose: () => void;
    onRemove: (productoId: string) => void;
    onUpdate: (productoId: string, cantidad: number) => void;
    onCheckout: () => void;
    onClear: () => void;
}

export default function CartDrawer({ isOpen, items, onClose, onRemove, onUpdate, onCheckout, onClear }: CartDrawerProps) {
    const total = items.reduce((sum, item) => sum + item.producto.precio * item.cantidad, 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40">
            <div className="relative w-full max-w-md h-full bg-white shadow-xl p-6 flex flex-col">
                <button
                    className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-800"
                    onClick={onClose}
                    aria-label="Cerrar"
                >
                    ×
                </button>
                <h2 className="text-xl font-bold mb-4">Carrito de compras</h2>
                {items.length === 0 ? (
                    <div className="text-gray-500 text-center py-12">El carrito está vacío</div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        <ul className="divide-y divide-slate-200">
                            {items.map(({ producto, cantidad }) => (
                                <li key={producto.id} className="py-4 flex items-center gap-4">
                                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                                        <img src={producto.imagenUrl || "/productos/placeholder.svg"} alt={producto.nombre} className="w-14 h-14 object-contain" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold">{producto.nombre}</div>
                                        <div className="text-sm text-gray-500">${producto.precio.toLocaleString("es-CO")} x {cantidad}</div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-1">
                                            <button className="w-6 h-6 rounded bg-slate-200" onClick={() => onUpdate(producto.id, Math.max(1, cantidad - 1))} disabled={cantidad <= 1}>-</button>
                                            <span className="w-6 text-center">{cantidad}</span>
                                            <button className="w-6 h-6 rounded bg-slate-200" onClick={() => onUpdate(producto.id, cantidad + 1)} disabled={cantidad >= producto.stock}>+</button>
                                        </div>
                                        <button className="text-xs text-red-500 hover:underline" onClick={() => onRemove(producto.id)}>Quitar</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {/* Resumen */}
                <div className="mt-6 border-t pt-4">
                    <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>${total.toLocaleString("es-CO")}</span>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button
                            className="flex-1 rounded bg-blue-600 text-white font-semibold py-2 text-lg hover:bg-blue-700 disabled:opacity-60"
                            onClick={onCheckout}
                            disabled={items.length === 0}
                        >
                            Ir a checkout
                        </button>
                        <button
                            className="flex-1 rounded bg-slate-200 text-slate-700 font-semibold py-2 text-lg hover:bg-slate-300 disabled:opacity-60"
                            onClick={onClear}
                            disabled={items.length === 0}
                        >
                            Limpiar carrito
                        </button>
                    </div>
                </div>
            </div>
            <div className="fixed inset-0 z-40" onClick={onClose} />
        </div>
    );
}
