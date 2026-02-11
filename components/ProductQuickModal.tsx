"use client";

import { useState, useEffect } from "react";
import type { Producto } from "@/lib/csv";
import Image from "next/image";

interface ProductQuickModalProps {
    producto: Producto;
    onClose: () => void;
    onAddToCart: (cantidad: number) => void;
    formatCurrency: (value: number | null) => string;
}

export default function ProductQuickModal({
    producto,
    onClose,
    onAddToCart,
    formatCurrency,
}: ProductQuickModalProps) {
    const [cantidad, setCantidad] = useState(1);
    const [imageUrl, setImageUrl] = useState('/productos/placeholder.svg');
    const [imageLoading, setImageLoading] = useState(true);

    useEffect(() => {
        // Fetch product image
        const fetchImage = async () => {
            try {
                const res = await fetch(`/api/producto-imagen?nombre=${encodeURIComponent(producto.nombre)}`);
                if (res.ok) {
                    const data = await res.json();
                    setImageUrl(data.imageUrl || '/productos/placeholder.svg');
                }
            } catch (error) {
                console.error('Error fetching product image:', error);
            } finally {
                setImageLoading(false);
            }
        };
        fetchImage();
    }, [producto.nombre]);

    const handleAddToCart = () => {
        onAddToCart(Math.max(1, cantidad));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md hover:bg-gray-100"
                >
                    ✕
                </button>

                {/* Product Image */}
                <div className="relative h-64 w-full bg-gradient-to-br from-slate-100 to-slate-200">
                    {imageLoading ? (
                        <div className="flex h-full items-center justify-center">
                            <div className="text-slate-400 text-4xl">📦</div>
                        </div>
                    ) : (
                        <Image
                            src={imageUrl}
                            alt={producto.nombre}
                            fill
                            className="object-contain p-4"
                            unoptimized
                        />
                    )}
                </div>

                <div className="space-y-6 p-6">
                    {/* Header */}
                    <div>
                        <div className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                            {producto.categoria}
                        </div>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900">
                            {producto.nombre}
                        </h2>
                    </div>

                    {/* Price and stock info */}
                    <div className="space-y-2 rounded-lg bg-slate-50 p-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Precio unitario:</span>
                            <span className="text-2xl font-bold text-green-700">
                                {formatCurrency(producto.precio_cop)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Stock disponible:</span>
                            <span className={`font-semibold ${(producto.stock ?? 0) > 0 ? "text-green-700" : "text-red-700"}`}>
                                {producto.stock ?? "N/D"} {producto.unidad}
                            </span>
                        </div>
                        {(producto.puntos_base ?? 0) > 0 && (
                            <div className="flex justify-between items-center border-t pt-2">
                                <span className="text-sm text-slate-600">Puntos base:</span>
                                <span className="font-semibold text-orange-700">
                                    ⭐ {producto.puntos_base}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Quantity selector */}
                    <div className="space-y-2">
                        <label htmlFor="cantidad-input" className="text-sm font-semibold text-slate-700">
                            Cantidad:
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                                className="rounded-lg border border-slate-300 px-4 py-2 font-semibold hover:bg-slate-100"
                                aria-label="Disminuir cantidad"
                            >
                                −
                            </button>
                            <input
                                id="cantidad-input"
                                type="number"
                                min="1"
                                max={producto.stock ?? 999}
                                value={cantidad}
                                onChange={(e) =>
                                    setCantidad(Math.max(1, parseInt(e.target.value) || 1))
                                }
                                className="w-16 rounded-lg border border-slate-300 px-2 py-2 text-center font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Cantidad a agregar"
                            />
                            <button
                                onClick={() =>
                                    setCantidad(
                                        Math.min(producto.stock ?? 999, cantidad + 1)
                                    )
                                }
                                className="rounded-lg border border-slate-300 px-4 py-2 font-semibold hover:bg-slate-100"
                                aria-label="Aumentar cantidad"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Subtotal */}
                    <div className="rounded-lg bg-blue-50 px-4 py-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-700">Subtotal:</span>
                            <span className="text-2xl font-bold text-blue-700">
                                {formatCurrency((producto.precio_cop ?? 0) * cantidad)}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-100"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleAddToCart}
                            disabled={(producto.stock ?? 0) === 0}
                            className="flex-1 rounded-lg bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {(producto.stock ?? 0) === 0 ? "Sin stock" : "Agregar al pedido"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
