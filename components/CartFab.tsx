"use client";

import { useEffect, useState } from "react";

type Props = {
    targetId?: string;
    count: number;
    subtotal: number;
    bodegaId?: string;
};

const formatCurrency = (value: number) => {
    return value.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    });
};

export default function CartFab({ targetId = "mi-pedido", count, subtotal }: Props) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // Ocultar si no hay items (según regla: "Si NO hay items, el botón puede ocultarse")
    if (count <= 0) return null;

    const handleClick = () => {
        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <button
            onClick={handleClick}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-[color:var(--brand-primary)] px-4 py-3 text-white shadow-lg transition hover:scale-105 hover:shadow-xl active:scale-95"
            aria-label="Ver carrito"
        >
            <div className="relative">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-6 w-6"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                    />
                </svg>
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                    {count}
                </span>
            </div>
            <div className="flex flex-col items-start leading-none">
                <span className="text-xs font-medium opacity-90">Mi Pedido</span>
                <span className="text-sm font-bold">{formatCurrency(subtotal)}</span>
            </div>
        </button>
    );
}
