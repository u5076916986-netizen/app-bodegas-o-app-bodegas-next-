"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCartKey } from "@/lib/cartStorage";

type Props = {
    bodegaId: string;
};

export default function CartFloatingButton({ bodegaId }: Props) {
    const pathname = usePathname();
    const router = useRouter();
    const [count, setCount] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const key = getCartKey(bodegaId);

        const checkCart = () => {
            const raw = window.localStorage.getItem(key);
            if (!raw) {
                setCount(0);
                return;
            }
            try {
                const items = JSON.parse(raw);
                if (Array.isArray(items)) {
                    const total = items.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0);
                    setCount(total);
                }
            } catch {
                setCount(0);
            }
        };

        // Chequeo inicial
        checkCart();

        // Polling simple para reaccionar a cambios en el carrito (ej: desde el listado de productos)
        const interval = setInterval(checkCart, 1000);
        return () => clearInterval(interval);
    }, [bodegaId]);

    // No renderizar en servidor o si estamos en la página de confirmación
    if (!mounted) return null;
    if (pathname?.includes("/pedido/confirmar")) return null;

    if (count === 0) return null;

    const handleClick = () => {
        const panel = document.getElementById("cart-panel");
        if (panel) {
            panel.scrollIntoView({ behavior: "smooth" });
        } else {
            router.push(`/pedido/confirmar?bodegaId=${bodegaId}`);
        }
    };

    return (
        <button
            onClick={handleClick}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--brand-primary)] text-white shadow-lg transition hover:scale-105 hover:shadow-xl active:scale-95"
            aria-label="Ver carrito"
        >
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

            {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-white">
                    {count}
                </span>
            )}
        </button>
    );
}