"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { clearCart, getActiveCart, listCarts, setActiveBodega, type Cart } from "@/lib/cart";
import { getCuponActivo } from "@/lib/cuponActivo";
import { type Cupon, validateCupon } from "@/lib/cupones";
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

type CuponWithDiscount = Cupon & { descuento: number };

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
    const [cupones, setCupones] = useState<Cupon[]>([]);
    const [activeCuponCode, setActiveCuponCode] = useState("");
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
        setActiveCuponCode(getCuponActivo());
    }, [mounted]);

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
        if (!draft?.bodegaId) return;
        const load = async () => {
            try {
                const res = await fetch(`/api/cupones?bodegaId=${encodeURIComponent(draft.bodegaId)}&activo=true`);
                const data = await res.json();
                if (res.ok && data?.ok) {
                    setCupones((data.cupones || []) as Cupon[]);
                }
            } catch {
                setCupones([]);
            }
        };
        load();
    }, [draft?.bodegaId]);

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
    const puntosEstimados = Math.floor(subtotal / 1000);
    const now = promoNow ? new Date(promoNow) : null;
    const cartIds = new Set(draft?.items.map((item) => item.productoId) ?? []);
    const recomendaciones = now
        ? buildRecommendations(catalogo, faltaMinimo, cartIds, promos, now, 6)
        : [];
    const showRecommendations = now ? faltaMinimo > 0 || hasActivePromos(promos, now) : false;

    const activeCuponResult = useMemo(() => {
        if (!activeCuponCode || !draft?.bodegaId) return { cupon: null as CuponWithDiscount | null, reason: null as string | null };
        const res = validateCupon(cupones, activeCuponCode, draft.bodegaId, subtotal);
        if (res.ok && res.cupon) {
            return { cupon: { ...res.cupon, descuento: res.descuentoCOP }, reason: null };
        }
        return { cupon: null, reason: res.reason || "Cupón inválido" };
    }, [activeCuponCode, cupones, draft?.bodegaId, subtotal]);

    const bestCupon = useMemo(() => {
        if (cupones.length === 0 || !draft?.bodegaId) return null;
        const valid = cupones
            .map((c) => {
                const res = validateCupon(cupones, c.code, draft.bodegaId, subtotal);
                if (!res.ok || !res.cupon) return null;
                return { ...res.cupon, descuento: res.descuentoCOP } as CuponWithDiscount;
            })
            .filter(Boolean) as CuponWithDiscount[];
        if (valid.length === 0) return null;
        return valid.sort((a, b) => b.descuento - a.descuento)[0];
    }, [cupones, draft?.bodegaId, subtotal]);

    const selectedCupon = activeCuponResult.cupon ?? bestCupon;
    const descuentoAplicado = selectedCupon ? Math.min(selectedCupon.descuento, subtotal) : 0;
    const totalFinal = Math.max(0, subtotal - descuentoAplicado);

    const nextCupon = useMemo(() => {
        if (cupones.length === 0) return null;
        return [...cupones].sort((a, b) => (a.minSubtotal ?? 0) - (b.minSubtotal ?? 0))[0];
    }, [cupones]);

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
            estado: "confirmado",
            repartidorId: "REP_001",
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
            total: totalFinal,
            totalOriginal: subtotal,
            discount: descuentoAplicado,
            coupon: selectedCupon
                ? { code: selectedCupon.code, descuentoCOP: descuentoAplicado }
                : undefined,
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


            if (!(resp.status === 200 || resp.status === 201)) {
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
                            <div key={item.productoId} className="flex items-center justify-between text-sm">
                                <span className="text-slate-700">{item.nombre}</span>
                                <span className="font-semibold text-slate-900">
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
                        {descuentoAplicado > 0 ? (
                            <div className="mt-2 flex items-center justify-between text-xs text-emerald-700">
                                <span>Descuento ({selectedCupon?.code})</span>
                                <span>- {formatCurrency(descuentoAplicado)}</span>
                            </div>
                        ) : null}
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-slate-600">Total</span>
                            <span className="font-semibold text-slate-900">{formatCurrency(totalFinal)}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                            <span>Puntos estimados</span>
                            <span className="font-semibold text-slate-900">{puntosEstimados}</span>
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
                        {faltaMinimo > 0 ? (
                            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                Te faltan <strong>{formatCurrency(faltaMinimo)}</strong> para el mínimo.
                                <button
                                    type="button"
                                    onClick={() => setShowReco(true)}
                                    className="ml-2 inline-flex rounded-full bg-amber-600 px-2 py-1 text-[10px] font-semibold text-white"
                                >
                                    Completar mínimo
                                </button>
                            </div>
                        ) : null}
                    </div>

                    {showRecommendations && showReco && recomendaciones.length > 0 ? (
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-900">Recomendados</h3>
                                <button
                                    type="button"
                                    onClick={() => setShowReco(false)}
                                    className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                                >
                                    Ocultar
                                </button>
                            </div>
                            <p className="text-xs text-slate-500">
                                Faltan {formatCurrency(faltaMinimo)} para el mínimo.
                            </p>
                            <div className="grid gap-2">
                                {recomendaciones.map((producto) => (
                                    <div key={producto.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-slate-900">{producto.nombre}</p>
                                                <p className="text-xs text-slate-500">{producto.categoria}</p>
                                            </div>
                                            <span className="text-xs font-semibold text-slate-700">
                                                {formatCurrency(producto.precio_cop ?? 0)}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => addRecommended(producto)}
                                            className="mt-2 inline-flex rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white"
                                        >
                                            Agregar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {activeCuponCode && !activeCuponResult.cupon && activeCuponResult.reason ? (
                        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            Cupón activo no aplica: {activeCuponResult.reason}
                        </div>
                    ) : null}
                    {selectedCupon ? (
                        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                            Cupón aplicado: {selectedCupon.code} · Ahorro estimado {formatCurrency(selectedCupon.descuento)}
                        </div>
                    ) : nextCupon ? (
                        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            Cupón disponible: {nextCupon.code} · Mínimo {formatCurrency(nextCupon.minSubtotal ?? 0)}
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
/ /   c a c h e   b u s t  
 