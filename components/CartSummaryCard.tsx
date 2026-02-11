"use client";

import Link from "next/link";
import type { CartItem } from "@/app/providers";

type CartSummaryCardProps = {
    items: CartItem[];
    total: number;
    onClear: () => void;
    continueHref: string;
    checkoutHref: string;
    checkoutDisabledReason?: string | null;
};

export default function CartSummaryCard({
    items,
    total,
    onClear,
    continueHref,
    checkoutHref,
    checkoutDisabledReason,
}: CartSummaryCardProps) {
    const hasItems = items.length > 0;
    const isCheckoutDisabled = Boolean(checkoutDisabledReason);

    return (
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Productos en tu carrito</h3>
            <div className="mt-3 space-y-3">
                {hasItems ? (
                    items.map((item) => (
                        <div key={item.productId} className="flex items-start justify-between text-xs">
                            <div className="flex-1">
                                <p className="font-semibold text-slate-900">{item.name || `Producto ${item.productId}`}</p>
                                <p className="text-slate-500">
                                    {item.qty} x {Number.isFinite(item.price) && item.price > 0 ? `$${item.price}` : "Precio pendiente"}
                                </p>
                            </div>
                            <div className="font-semibold text-slate-900">
                                {Number.isFinite(item.price) && item.price > 0
                                    ? `$${(item.price * item.qty).toFixed(2)}`
                                    : "—"}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-600">
                        Tu carrito está vacío.
                    </div>
                )}

                <div className="border-t pt-3 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-600">Total</span>
                        <span className="font-semibold text-slate-900">
                            {Number.isFinite(total) && total > 0 ? `$${total.toFixed(2)}` : "—"}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    {checkoutDisabledReason ? (
                        <p className="text-xs font-semibold text-amber-700">{checkoutDisabledReason}</p>
                    ) : null}
                    {isCheckoutDisabled ? (
                        <button
                            type="button"
                            disabled
                            className="rounded-xl bg-slate-300 px-3 py-2 text-center text-sm font-semibold text-white"
                        >
                            Completar compra
                        </button>
                    ) : (
                        <Link
                            href={checkoutHref}
                            className="rounded-xl bg-slate-900 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
                        >
                            Completar compra
                        </Link>
                    )}
                    <Link
                        href={continueHref}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Seguir comprando
                    </Link>
                    {hasItems ? (
                        <button
                            type="button"
                            onClick={() => {
                                const ok = window.confirm("¿Vaciar carrito?");
                                if (ok) onClear();
                            }}
                            className="text-left text-xs font-semibold text-slate-500 hover:text-slate-700"
                        >
                            Vaciar carrito
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
