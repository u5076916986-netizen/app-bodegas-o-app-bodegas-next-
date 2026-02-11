"use client";

import { useCart } from "@/app/providers";
import StepperNav from "@/components/StepperNav";
import CartSummaryCard from "@/components/CartSummaryCard";
import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";

export default function CartClient() {
    const { items, total, count, setQty, removeItem, clear } = useCart();
    const [mounted, setMounted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [minimoPedido, setMinimoPedido] = useState<number | null>(null);

    useEffect(() => setMounted(true), []);
    const bodegaIds = useMemo(
        () => Array.from(new Set(items.map((item) => item.bodegaId).filter(Boolean) as string[])),
        [items],
    );
    const activeBodegaId = bodegaIds.length === 1 ? bodegaIds[0] : null;
    const subtotalForBodega = useMemo(() => {
        if (!activeBodegaId) return total;
        return items
            .filter((item) => item.bodegaId === activeBodegaId)
            .reduce((sum, item) => sum + item.price * item.qty, 0);
    }, [items, total, activeBodegaId]);

    useEffect(() => {
        if (!mounted) return;
        if (!activeBodegaId) {
            setMinimoPedido(null);
            return;
        }

        const loadMinimo = async () => {
            try {
                const res = await fetch("/data/bodegas.csv", { cache: "no-store" });
                const csvText = await res.text();
                const parsed = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true });
                const rows = Array.isArray(parsed.data) ? parsed.data : [];
                const row = rows.find((item) => (item?.bodega_id || "").trim() === activeBodegaId);
                const raw = row?.min_pedido_cop ?? "";
                const asNumber = Number(raw);
                setMinimoPedido(Number.isFinite(asNumber) ? asNumber : null);
            } catch {
                setMinimoPedido(null);
            }
        };

        loadMinimo();
    }, [mounted, activeBodegaId]);

    const formatCurrency = (value: number) =>
        value.toLocaleString("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0,
        });

    const faltaMinimo = minimoPedido && minimoPedido > 0 ? Math.max(0, minimoPedido - subtotalForBodega) : 0;
    const checkoutHref = activeBodegaId
        ? `/tendero/checkout?bodegaId=${encodeURIComponent(activeBodegaId)}`
        : "/tendero/checkout";
    const checkoutDisabledReason =
        items.length === 0
            ? "Agrega productos para continuar"
            : faltaMinimo > 0
                ? `Faltan ${formatCurrency(faltaMinimo)} para el mínimo`
                : null;
    if (!mounted) {
        return (
            <div className="mx-auto max-w-4xl p-4">
                <div className="h-5 w-40 rounded bg-slate-200" />
                <div className="mt-4 space-y-3 rounded-2xl border bg-white p-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded bg-slate-200" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-32 rounded bg-slate-200" />
                                <div className="h-3 w-24 rounded bg-slate-100" />
                            </div>
                            <div className="h-8 w-16 rounded bg-slate-200" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-4 p-4">
            <StepperNav currentStep="carrito" />

            <div className="flex items-end justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold">Carrito</h1>
                    <p className="text-sm text-gray-600">{count} productos</p>
                </div>
            </div>

            {error ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    {error}
                </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="rounded-2xl border bg-white">
                    {items.length === 0 ? (
                        <div className="p-6 text-sm text-gray-600">Tu carrito está vacío.</div>
                    ) : (
                        <div className="divide-y">
                            {items.map((x) => (
                                <div key={x.productId} className="flex items-center gap-3 p-4">
                                    <div className="flex-1">
                                        <div className="text-sm font-medium">{x.name || `Producto ${x.productId}`}</div>
                                        <div className="text-xs text-gray-600">
                                            {Number.isFinite(x.price) && x.price > 0 ? `$${x.price} c/u` : "Precio pendiente"}
                                        </div>
                                    </div>

                                    <input
                                        type="number"
                                        min={1}
                                        className="h-9 w-20 rounded-xl border px-2 text-sm"
                                        value={x.qty}
                                        onChange={(e) => {
                                            const next = Number(e.target.value);
                                            if (!Number.isFinite(next) || next < 1) {
                                                setError("La cantidad debe ser un número válido mayor a 0.");
                                                return;
                                            }
                                            setError(null);
                                            setQty(x.productId, next);
                                        }}
                                    />

                                    <div className="w-24 text-right text-sm font-semibold">
                                        {Number.isFinite(x.price) && x.price > 0
                                            ? `$${(x.price * x.qty).toFixed(2)}`
                                            : "—"}
                                    </div>

                                    <button
                                        className="h-9 rounded-xl border px-3 text-sm"
                                        onClick={() => removeItem(x.productId)}
                                    >
                                        Quitar
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="lg:sticky lg:top-24 h-fit">
                    <CartSummaryCard
                        items={items}
                        total={total}
                        onClear={clear}
                        continueHref="/tendero"
                        checkoutHref={checkoutHref}
                        checkoutDisabledReason={checkoutDisabledReason}
                    />
                </div>
            </div>
        </div>
    );
}
