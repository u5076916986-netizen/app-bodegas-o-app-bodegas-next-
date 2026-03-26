"use client";

import { useState } from "react";
import Image from "next/image";
import type { Producto } from "@/components/ProductosClient";

interface ProductDrawerProps {
    producto: Producto;
    isOpen: boolean;
    onClose: () => void;
    onAddToCart: (producto: Producto, cantidad: number) => void;
}

export default function ProductDrawer({ producto, isOpen, onClose, onAddToCart }: ProductDrawerProps) {
    const [cantidad, setCantidad] = useState(1);

    if (!isOpen || !producto) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40">
            <div className="relative w-full max-w-md h-full bg-white shadow-xl p-6 flex flex-col">
                {/* Cerrar */}
                <button
                    className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-800"
                    onClick={onClose}
                    aria-label="Cerrar"
                >
                    ×
                </button>
                {/* Imagen */}
                <div className="flex justify-center items-center mb-4">
                    <Image
                        src={producto.imagenUrl || "/productos/placeholder.svg"}
                        alt={producto.nombre}
                        width={180}
                        height={180}
                        className="rounded-xl object-contain bg-slate-100"
                    />
                </div>
                {/* Info */}
                <h2 className="text-xl font-bold mb-2">{producto.nombre}</h2>
                <p className="text-gray-600 mb-2">{producto.descripcion}</p>
                <div className="text-lg font-semibold text-blue-700 mb-2">
                    ${producto.precio?.toLocaleString("es-CO")}
                </div>
                <div className="text-sm text-gray-500 mb-4">Stock disponible: {producto.stock}</div>
                {/* Controles cantidad */}
                <div className="flex items-center gap-2 mb-6">
                    <button
                        className="w-8 h-8 rounded bg-slate-200 text-lg font-bold"
                        onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                        aria-label="Disminuir"
                    >
                        -
                    </button>
                    <span className="w-8 text-center">{cantidad}</span>
                    <button
                        className="w-8 h-8 rounded bg-slate-200 text-lg font-bold"
                        onClick={() => setCantidad((c) => Math.min(producto.stock, c + 1))}
                        aria-label="Aumentar"
                        disabled={cantidad >= producto.stock}
                    >
                        +
                    </button>
                </div>
                {/* Agregar al carrito */}
                <button
                    className="w-full rounded bg-blue-600 text-white font-semibold py-2 text-lg hover:bg-blue-700 disabled:opacity-60"
                    onClick={() => onAddToCart(producto, cantidad)}
                    disabled={producto.stock === 0}
                >
                    Agregar al carrito
                </button>
            </div>
            {/* Fondo para cerrar */}
            <div className="fixed inset-0 z-40" onClick={onClose} />
        </div>
    );
}
