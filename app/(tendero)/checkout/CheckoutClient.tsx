"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { clearCart, getActiveCart, listCarts, setActiveBodega, type Cart } from "@/lib/cart";
import { saveBodegaId, saveTenderoPhone } from "@/lib/storage";
import { readCatalogSnapshot, saveCatalogSnapshot, type CatalogItem } from "@/lib/catalogStorage";
import { buildRecommendations, hasActivePromos, type PromoRule } from "@/lib/recommendations";
import {
    clearCheckoutDraft,
    readCheckoutDraft,
    saveCheckoutDraft,
    type CheckoutDraft,
} from "@/lib/checkoutStorage";
import StepperNav from "@/components/StepperNav";

const formatCurrency = (value: number) =>
    value.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    });

const buildPedidoId = (bodegaId: string) => {
    const cleaned = (bodegaId || "").trim() || "BOD";
    const cryptoObj = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
    const buffer = cryptoObj?.getRandomValues
        ? cryptoObj.getRandomValues(new Uint8Array(8))
        : new Uint8Array(8);
    const fallback = Array.from(buffer)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    const uuid = cryptoObj?.randomUUID ? cryptoObj.randomUUID() : fallback;
    return `PED_${cleaned}_${uuid.slice(0, 8).toUpperCase()}`;
};

export default function CheckoutClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [draft, setDraft] = useState<CheckoutDraft | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [availableCarts, setAvailableCarts] = useState<Cart[]>([]);
    const [activeBodegaId, setActiveBodegaId] = useState<string | null>(null);
    const [catalogo, setCatalogo] = useState<CatalogItem[]>([]);
    const [promos, setPromos] = useState<PromoRule[]>([]);
    const [promoNow, setPromoNow] = useState<string | null>(null);
    const [showReco, setShowReco] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const paramBodegaId = searchParams.get("bodegaId")?.trim() || undefined;
        const { cart, bodegaId } = getActiveCart(paramBodegaId);
        const carts = listCarts();
        setAvailableCarts(carts);
        setActiveBodegaId(bodegaId);

        const stored = readCheckoutDraft();
        if (stored && (!bodegaId || stored.bodegaId === bodegaId)) {
            setDraft(stored);
            return;
        }

        if (cart && bodegaId) {
            const items = cart.items
                .map((item) => ({
                    productoId: item.productoId,
                    nombre: item.nombre ?? "",
                    precio: Number(item.precio ?? item.precio_cop ?? 0),
                    quantity: Number(item.quantity ?? item.cantidad ?? 0),
                    sku: item.sku ?? "",
                }))
                .filter((item) => item.quantity > 0);

            if (items.length > 0) {
                const next: CheckoutDraft = {
                    bodegaId,
                    items,
                    nombre: stored?.nombre ?? "",
                    telefono: stored?.telefono ?? "",
                    direccion: stored?.direccion ?? "",
                    pagoConfirmado: stored?.pagoConfirmado ?? false,
                    minimoPedido: stored?.minimoPedido,
                    bodegaNombre: stored?.bodegaNombre,
                    updatedAt: new Date().toISOString(),
                };
                setDraft(next);
                saveCheckoutDraft(next);
                setActiveBodega(bodegaId);
                return;
            }
        }

        setDraft(null);
    }, [mounted, searchParams]);

    useEffect(() => {
        if (!mounted || !draft?.bodegaId) return;
        setPromoNow(new Date().toISOString());

        const snapshot = readCatalogSnapshot(draft.bodegaId);
        if (snapshot.length > 0) {
            setCatalogo(snapshot);
            return;
        }

        const loadCatalog = async () => {
            try {
                const res = await fetch("/data/productos.json", { cache: "no-store" });
                const data = await res.json();
                const list = Array.isArray(data) ? data : [];
                const filtered = list
                    .filter((item: any) => item.bodegaId === draft.bodegaId)
                    .map((item: any) => ({
                        id: item.id,
                        bodegaId: item.bodegaId,
                        nombre: item.nombre,
                        categoria: item.categoria,
                        precio: item.precio ?? 0,
                        precio_cop: item.precio ?? 0,
                        stock: item.stock,
                        activo: item.activo,
                        sku: item.sku,
                    })) as CatalogItem[];
                setCatalogo(filtered);
                saveCatalogSnapshot(draft.bodegaId, filtered);
            } catch {
                setCatalogo([]);
            }
        };
        loadCatalog();
    }, [mounted, draft?.bodegaId]);

    useEffect(() => {
        if (!mounted || !draft?.bodegaId) return;
        const loadPromos = async () => {
            try {
                const res = await fetch("/data/promociones.json", { cache: "no-store" });
                const data = await res.json();
                const list = Array.isArray(data) ? data : [];
                setPromos(list.filter((promo: PromoRule) => promo.bodegaId === draft.bodegaId));
            } catch {
                setPromos([]);
            }
        };
        loadPromos();
    }, [mounted, draft?.bodegaId]);

    const subtotal = useMemo(() => {
        if (!draft) return 0;
        return draft.items.reduce((sum, item) => sum + item.precio * item.quantity, 0);
    }, [draft]);

    const minimoPedido = draft?.minimoPedido ?? 0;
    const faltaMinimo = Math.max(0, minimoPedido - subtotal);
    const now = promoNow ? new Date(promoNow) : null;
    const cartIds = new Set(draft?.items.map((item) => item.productoId) ?? []);
    const recomendaciones = now
        ? buildRecommendations(catalogo, faltaMinimo, cartIds, promos, now, 6)
        : [];
    const showRecommendations = now ? faltaMinimo > 0 || hasActivePromos(promos, now) : false;

    const updateDraft = (updates: Partial<CheckoutDraft>) => {
        if (!draft) return;
        const next = { ...draft, ...updates, updatedAt: new Date().toISOString() };
        setDraft(next);
        saveCheckoutDraft(next);
    };

    const addRecommended = (item: CatalogItem) => {
        if (!draft) return;
        const price = Number(item.precio_cop ?? item.precio ?? 0);
        const existing = draft.items.find((line) => line.productoId === item.id);
        const nextItems = existing
            ? draft.items.map((line) =>
                line.productoId === item.id
                    ? { ...line, quantity: line.quantity + 1 }
                    : line,
            )
            : [
                ...draft.items,
                {
                    productoId: item.id,
                    nombre: item.nombre ?? "",
                    precio: price,
                    quantity: 1,
                    sku: item.sku,
                },
            ];
        updateDraft({ items: nextItems });
    };

    const handleConfirmar = async () => {
        if (!draft) return;
        const nombre = (draft.nombre || "").trim();
        const telefono = (draft.telefono || "").trim();
        const direccion = (draft.direccion || "").trim();

        if (!nombre) {
            setStatus("Ingresa el nombre del contacto.");
            return;
        }
        if (!telefono) {
            setStatus("Ingresa un teléfono válido.");
            return;
        }
        if (!direccion) {
            setStatus("Ingresa la dirección de entrega.");
            return;
        }
        if (!draft.pagoConfirmado) {
            setStatus("Debes confirmar el pago para continuar.");
            return;
        }
        if (draft.items.length === 0) {
            setStatus("Tu carrito está vacío.");
            return;
        }
        if (minimoPedido > 0 && subtotal < minimoPedido) {
            setStatus(`El pedido no alcanza el mínimo: ${formatCurrency(minimoPedido)}.`);
            return;
        }

        setLoading(true);
        setStatus(null);

        const pedidoId = buildPedidoId(draft.bodegaId);
        const payload = {
            id: pedidoId,
            pedidoId,
            bodegaId: draft.bodegaId,
            estado: "nuevo",
            cliente: {
                nombre,
                telefono,
            },
            direccion,
            items: draft.items.map((item) => ({
                productoId: item.productoId,
                nombre: item.nombre,
                sku: item.sku,
                precio: item.precio,
                precio_cop: item.precio,
                cantidad: item.quantity,
                subtotal: item.precio * item.quantity,
            })),
            total: subtotal,
            createdAt: new Date().toISOString(),
            datosEntrega: {
                nombre,
                telefono,
                direccion,
                notas: null,
            },
        };

        try {
            const resp = await fetch("/api/pedidos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!resp.ok) {
                const errData = await resp.json().catch(() => ({}));
                throw new Error(errData.error || `Error HTTP ${resp.status}`);
            }

            const data = (await resp.json()) as { ok: boolean; pedido?: { pedidoId?: string; id?: string } };
            if (!data.ok) {
                throw new Error("La API no respondió ok");
            }

            const finalId = data.pedido?.pedidoId ?? data.pedido?.id ?? pedidoId;
            saveTenderoPhone(telefono);
            saveBodegaId(draft.bodegaId);
            setActiveBodega(draft.bodegaId);
            clearCart(draft.bodegaId);
            clearCheckoutDraft();
            router.push(`/tendero/seguimiento/${encodeURIComponent(finalId)}`);
        } catch (err: any) {
            console.error(err);
            setStatus(err.message || "No se pudo confirmar el pedido.");
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) {
        return (
            <main className="mx-auto max-w-4xl px-4 py-10">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                    <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
                    <p className="mt-2 text-sm text-slate-600">Cargando carrito...</p>
                </div>
            </main>
        );
    }

    if (!draft) {
        const cartsWithItems = availableCarts.filter((cart) => cart.items.length > 0);
        const otherCarts = cartsWithItems.filter((cart) => cart.bodegaId !== activeBodegaId);
        return (
            <main className="mx-auto max-w-4xl px-4 py-10">
                <StepperNav currentStep="confirmar" />
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                    <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
                    <p className="mt-2 text-sm text-slate-600">No encontramos un carrito activo.</p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        <Link
                            href="/tendero"
                            className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                        >
                            Volver a bodegas
                        </Link>
                        <Link
                            href="/bodegas"
                            className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                        >
                            Ir al catálogo
                        </Link>
                        {cartsWithItems.length > 0 ? (
                            <Link
                                href={`/tendero/checkout?bodegaId=${encodeURIComponent(cartsWithItems[0].bodegaId)}`}
                                className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                            >
                                Ver carrito
                            </Link>
                        ) : null}
                    </div>
                    {otherCarts.length > 0 ? (
                        <div className="mt-4 text-xs text-slate-500">
                            Carritos en otras bodegas:{" "}
                            {otherCarts.map((cart) => (
                                <Link
                                    key={cart.bodegaId}
                                    href={`/tendero/checkout?bodegaId=${encodeURIComponent(cart.bodegaId)}`}
                                    className="ml-2 inline-flex rounded-full border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700"
                                >
                                    {cart.bodegaId}
                                </Link>
                            ))}
                        </div>
                    ) : null}
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-5xl px-4 py-8">
            <StepperNav currentStep="confirmar" />
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>
                <p className="text-slate-600">Revisa los datos antes de confirmar.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <section className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Datos de entrega</h2>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <input
                                value={draft.nombre || ""}
                                onChange={(e) => updateDraft({ nombre: e.target.value })}
                                placeholder="Nombre"
                                className="w-full rounded-full border border-slate-300 px-3 py-2 text-sm"
                            />
                            <input
                                value={draft.telefono || ""}
                                onChange={(e) => updateDraft({ telefono: e.target.value })}
                                placeholder="Teléfono"
                                className="w-full rounded-full border border-slate-300 px-3 py-2 text-sm"
                            />
                        </div>
                        <input
                            value={draft.direccion || ""}
                            onChange={(e) => updateDraft({ direccion: e.target.value })}
                            placeholder="Dirección"
                            className="mt-3 w-full rounded-full border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Pago</h2>
                        <label className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                            <input
                                type="checkbox"
                                checked={Boolean(draft.pagoConfirmado)}
                                onChange={(e) => updateDraft({ pagoConfirmado: e.target.checked })}
                                className="h-4 w-4"
                            />
                            Confirmo el pago del pedido.
                        </label>
                    </div>

                    {status ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            {status}
                        </div>
                    ) : null}
                </section>

                <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Resumen</h2>
                    <p className="text-xs text-slate-500">{draft.items.length} producto(s)</p>

                    <div className="mt-4 space-y-2">
                        {draft.items.map((item) => (
                            <div key={item.productoId} className="flex items-center justify-between gap-3 text-sm">
                                <span className="min-w-0 flex-1 truncate text-slate-700">{item.nombre}</span>
                                <span className="shrink-0 font-semibold text-slate-900">
                                    {formatCurrency(item.precio * item.quantity)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 border-t pt-4 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-600">Subtotal</span>
                            <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                            Mínimo de la bodega: {formatCurrency(minimoPedido)}
                        </div>
                        {faltaMinimo > 0 ? (
                            <div className="mt-2 text-xs text-amber-700">
                                Te faltan {formatCurrency(faltaMinimo)} para el mínimo.
                            </div>
                        ) : (
                            <div className="mt-2 text-xs text-emerald-700">Listo para confirmar.</div>
                        )}
                    </div>

                    {showRecommendations ? (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <p className="font-semibold">Completar mínimo</p>
                                    <p className="text-[11px] text-amber-700">
                                        Suma productos sugeridos y aprovecha promos activas.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowReco((prev) => !prev)}
                                    className="rounded-full bg-amber-600 px-3 py-1 text-[11px] font-semibold text-white"
                                >
                                    {showReco ? "Ocultar" : "Ver sugerencias"}
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {showReco ? (
                        <div className="mt-3 space-y-2">
                            {recomendaciones.length === 0 ? (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                                    No encontramos recomendaciones por ahora.
                                </div>
                            ) : (
                                recomendaciones.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-semibold text-slate-900">{item.nombre}</p>
                                            <p className="truncate text-[11px] text-slate-500">
                                                {item.categoria || "Sugerido"} · {formatCurrency(Number(item.precio_cop ?? item.precio ?? 0))}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => addRecommended(item)}
                                            className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700"
                                        >
                                            Agregar
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : null}

                    <button
                        type="button"
                        onClick={handleConfirmar}
                        disabled={loading}
                        className="mt-4 w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                        {loading ? "Confirmando..." : "Confirmar pedido"}
                    </button>
                    <Link
                        href="/tendero"
                        className="mt-3 inline-flex w-full justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
                    >
                        Seguir comprando
                    </Link>
                </aside>
            </div>
        </main>
    );
}
