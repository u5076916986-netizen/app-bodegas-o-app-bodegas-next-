"use client";

import Modal from "@/components/Modal";
import type { Producto } from "@/lib/csv";
import { saveCheckoutDraft } from "@/lib/checkoutStorage";
import { setActiveBodega } from "@/lib/cart";
import { buildRecommendations, hasActivePromos, type PromoRule } from "@/lib/recommendations";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export type CartLine = {
    producto: Producto;
    quantity: number;
};

type Props = {
    isOpen: boolean;
    bodegaId: string;
    bodegaNombre?: string;
    minimoPedido?: number | null;
    items: CartLine[];
    subtotal: number;
    nombre: string;
    telefono: string;
    direccion: string;
    pagoConfirmado: boolean;
    isFormValid: boolean;
    statusMsg: string | null;
    isSending: boolean;
    successPedidoId: string | null;
    onClose: () => void;
    onChangeNombre: (value: string) => void;
    onChangeTelefono: (value: string) => void;
    onChangeDireccion: (value: string) => void;
    onTogglePagoConfirmado: (value: boolean) => void;
    onChangeQuantity: (productoId: string, delta: number) => void;
    onAddProduct?: (producto: Producto) => void;
    onViewEntrega: (pedidoId: string) => void;
    formatCurrency: (value: number | null) => string;
    catalogo?: Producto[];
};

type Cupon = {
    id: string;
    code: string;
    minSubtotal?: number;
    type: "fixed" | "percent";
    value: number;
};

export default function CarritoDrawer({
    isOpen,
    bodegaId,
    bodegaNombre,
    minimoPedido,
    items,
    subtotal,
    nombre,
    telefono,
    direccion,
    pagoConfirmado,
    isFormValid,
    statusMsg,
    isSending,
    successPedidoId,
    onClose,
    onChangeNombre,
    onChangeTelefono,
    onChangeDireccion,
    onTogglePagoConfirmado,
    onChangeQuantity,
    onAddProduct,
    onViewEntrega,
    formatCurrency,
    catalogo = [],
}: Props) {
    const router = useRouter();
    const canFinalize = items.length > 0 && !isSending;
    const [cupones, setCupones] = useState<Cupon[]>([]);
    const [promos, setPromos] = useState<PromoRule[]>([]);
    const [showReco, setShowReco] = useState(false);
    const [promoNow, setPromoNow] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !bodegaId) return;
        const load = async () => {
            try {
                const res = await fetch(`/api/cupones?bodegaId=${encodeURIComponent(bodegaId)}&activo=true`);
                const data = await res.json();
                if (res.ok && data?.ok) {
                    setCupones((data.cupones || []) as Cupon[]);
                }
            } catch {
                setCupones([]);
            }
        };
        load();
    }, [isOpen, bodegaId]);

    useEffect(() => {
        if (!isOpen || !bodegaId) return;
        const loadPromos = async () => {
            try {
                const res = await fetch("/data/promociones.json", { cache: "no-store" });
                const data = await res.json();
                const list = Array.isArray(data) ? data : [];
                setPromos(list.filter((promo: PromoRule) => promo.bodegaId === bodegaId));
            } catch {
                setPromos([]);
            }
        };
        loadPromos();
    }, [isOpen, bodegaId]);

    useEffect(() => {
        if (!isOpen) return;
        setPromoNow(new Date().toISOString());
    }, [isOpen]);

    const minimo = minimoPedido ?? 0;
    const faltante = Math.max(0, minimo - subtotal);
    const cartIds = new Set(items.map((line) => line.producto.producto_id));
    const now = promoNow ? new Date(promoNow) : null;
    const recomendaciones = now
        ? buildRecommendations(
            catalogo.map((producto) => ({
                id: producto.producto_id,
                bodegaId,
                nombre: producto.nombre,
                categoria: producto.categoria,
                precio_cop: producto.precio_cop ?? producto.precio ?? 0,
                precio: producto.precio ?? producto.precio_cop ?? 0,
                stock: producto.stock,
                activo: producto.activo,
                sku: (producto as any).sku,
            })),
            faltante,
            cartIds,
            promos,
            now,
            6,
        )
        : [];
    const showRecommendations = now ? faltante > 0 || hasActivePromos(promos, now) : false;

    const handleFinalize = () => {
        if (!canFinalize) return;
        saveCheckoutDraft({
            bodegaId,
            bodegaNombre,
            minimoPedido,
            items: items.map((line) => ({
                productoId: line.producto.producto_id,
                nombre: line.producto.nombre,
                precio: line.producto.precio_cop ?? 0,
                quantity: line.quantity,
                sku: (line.producto as any).sku,
            })),
            nombre,
            telefono,
            direccion,
            pagoConfirmado,
            updatedAt: new Date().toISOString(),
        });
        setActiveBodega(bodegaId);
        onClose();
        router.push(`/tendero/checkout?bodegaId=${encodeURIComponent(bodegaId)}`);
    };

    return (
        <Modal
            isOpen={isOpen}
            title="Tu carrito"
            onClose={onClose}
            onConfirm={handleFinalize}
            confirmDisabled={!canFinalize}
            confirmText={isSending ? "Cargando..." : "Finalizar compra"}
            cancelText="Seguir comprando"
            size="lg"
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-700">Resumen</h4>
                        <span className="text-xs text-slate-500">{items.length} producto(s)</span>
                    </div>
                    {minimo > 0 && faltante > 0 ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            Te faltan <strong>{formatCurrency(faltante)}</strong> para el mínimo.
                            <button
                                type="button"
                                onClick={() => setShowReco(true)}
                                className="ml-2 inline-flex rounded-full bg-amber-600 px-2 py-1 text-[10px] font-semibold text-white"
                            >
                                Completar mínimo
                            </button>
                        </div>
                    ) : null}
                    {items.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                            No hay productos en el carrito.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {items.map((line) => (
                                <div
                                    key={line.producto.producto_id}
                                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                                >
                                    <div>
                                        <div className="font-semibold text-slate-800">{line.producto.nombre}</div>
                                        <div className="mt-1 flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => onChangeQuantity(line.producto.producto_id, -1)}
                                                className="h-7 w-7 rounded border border-slate-200 text-sm text-slate-700 hover:bg-slate-50"
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center text-xs font-semibold text-slate-700">
                                                x{line.quantity}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => onChangeQuantity(line.producto.producto_id, 1)}
                                                className="h-7 w-7 rounded border border-slate-200 text-sm text-slate-700 hover:bg-slate-50"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                    <div className="font-semibold text-slate-800">
                                        {formatCurrency((line.producto.precio_cop ?? 0) * line.quantity)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                        <span className="text-slate-600">Total</span>
                        <span className="text-base font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
                    </div>
                </div>

                {showRecommendations && showReco && recomendaciones.length > 0 ? (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-slate-700">Completar mínimo</h4>
                            <button
                                type="button"
                                onClick={() => setShowReco(false)}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                            >
                                Ocultar
                            </button>
                        </div>
                        <p className="text-xs text-slate-500">
                            Faltan {formatCurrency(faltante)} para el mínimo.
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {recomendaciones.map((producto) => (
                                <div key={producto.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                                    <p className="font-semibold text-slate-900">{producto.nombre}</p>
                                    <p className="text-xs text-slate-500">{producto.categoria}</p>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-slate-700">
                                            {formatCurrency(producto.precio_cop ?? producto.precio ?? 0)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const target = catalogo.find((p) => p.producto_id === producto.id);
                                                if (target) onAddProduct?.(target);
                                            }}
                                            className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white"
                                        >
                                            Agregar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}

                <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-700">Datos de entrega</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <input
                            value={nombre}
                            onChange={(e) => onChangeNombre(e.target.value)}
                            placeholder="Nombre"
                            className="w-full rounded-full border border-slate-300 px-3 py-2 text-sm"
                        />
                        <input
                            value={telefono}
                            onChange={(e) => onChangeTelefono(e.target.value)}
                            placeholder="Teléfono"
                            className="w-full rounded-full border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <input
                        value={direccion}
                        onChange={(e) => onChangeDireccion(e.target.value)}
                        placeholder="Dirección"
                        className="w-full rounded-full border border-slate-300 px-3 py-2 text-sm"
                    />
                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                        <input
                            type="checkbox"
                            checked={pagoConfirmado}
                            onChange={(e) => onTogglePagoConfirmado(e.target.checked)}
                            className="h-4 w-4"
                        />
                        Confirmo el pago del pedido.
                    </label>
                    {!isFormValid && items.length > 0 ? (
                        <p className="text-xs text-amber-700">
                            Completa nombre, teléfono y dirección para continuar.
                        </p>
                    ) : null}
                    {!pagoConfirmado && items.length > 0 ? (
                        <p className="text-xs text-amber-700">
                            Confirma el pago para enviar el pedido.
                        </p>
                    ) : null}
                    {statusMsg ? (
                        <div className="space-y-2">
                            <p className={`text-xs ${successPedidoId ? "text-emerald-700" : "text-red-600"}`}>
                                {statusMsg}
                            </p>
                            {successPedidoId ? (
                                <button
                                    type="button"
                                    onClick={() => onViewEntrega(successPedidoId)}
                                    className="rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                                >
                                    Ver entrega
                                </button>
                            ) : null}
                        </div>
                    ) : null}
                    {cupones.length > 0 ? (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                            Cupón disponible en checkout: {cupones.slice(0, 2).map((c) => c.code).join(", ")}
                        </div>
                    ) : null}
                </div>
            </div>
        </Modal>
    );
}
