"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CartFabProps = {
    bodegaId: string;
    itemCount: number;
    total: number;
};

export default function CartFab({ bodegaId, itemCount, total }: CartFabProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || itemCount === 0) return null;

    const href = `/pedido/confirmar?bodegaId=${bodegaId}`;

    return (
        <>
            {/* MOBILE: Bottom Bar Fija */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 md:hidden">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-600">
                            {itemCount} {itemCount === 1 ? "item" : "items"}
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                            ${total.toLocaleString("es-CO")}
                        </span>
                    </div>
                    <Link
                        href={href}
                        className="flex-1 bg-blue-600 text-white text-center py-3 px-4 rounded-lg font-bold text-base active:bg-blue-700 transition-colors"
                    >
                        Ir a pagar
                    </Link>
                </div>
            </div>

            {/* DESKTOP: Floating Action Button */}
            <Link
                href={href}
                className="hidden md:flex fixed bottom-8 right-8 z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-transform hover:scale-105 items-center gap-3"
            >
                <div className="relative">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="8" cy="21" r="1" />
                        <circle cx="19" cy="21" r="1" />
                        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                    </svg>
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                        {itemCount}
                    </span>
                </div>
                <span className="font-bold">${total.toLocaleString("es-CO")}</span>
            </Link>

            {/* Spacer para móvil para que el contenido no quede tapado */}
            <div className="h-24 md:hidden" />
        </>
    );
}