"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { readCatalogSnapshot } from "@/lib/catalogStorage";
import { saveCart, clearCart } from "@/lib/cart";

export type CartItem = {
    productId: string;
    name: string;
    price: number;
    qty: number;
    imageUrl?: string;
    bodegaId?: string;
};

type CartState = {
    items: CartItem[];
    addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
    removeItem: (productId: string) => void;
    setQty: (productId: string, qty: number) => void;
    clear: () => void;
    total: number;
    count: number;
};

const CartContext = createContext<CartState | null>(null);

const STORAGE_KEY = "APP_BODEGAS_CART_V1";

type LegacyCartItem = {
    productoId?: string;
    productId?: string;
    quantity?: number;
    cantidad?: number;
};

const readLegacyCarts = (): CartItem[] => {
    if (typeof window === "undefined") return [];
    const items: CartItem[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i) || "";
        if (!key.startsWith("pedido:")) continue;
        const bodegaId = key.replace("pedido:", "").trim();
        if (!bodegaId) continue;
        try {
            const raw = window.localStorage.getItem(key);
            if (!raw) continue;
            const parsed = JSON.parse(raw) as LegacyCartItem[];
            if (!Array.isArray(parsed)) continue;
            const catalog = readCatalogSnapshot(bodegaId);
            parsed.forEach((entry) => {
                const productId = String(entry.productoId ?? entry.productId ?? "").trim();
                if (!productId) return;
                const qty = Number(entry.quantity ?? entry.cantidad ?? 0);
                const safeQty = Number.isFinite(qty) ? Math.max(1, qty) : 1;
                const product = catalog.find((p) => p.id === productId);
                items.push({
                    productId,
                    name: product?.nombre ?? `Producto ${productId}`,
                    price: Number(product?.precio_cop ?? product?.precio ?? 0),
                    qty: safeQty,
                    bodegaId,
                });
            });
        } catch {
            // ignore
        }
    }
    return items;
};

const mergeItems = (primary: CartItem[], fallback: CartItem[]) => {
    const map = new Map<string, CartItem>();
    const add = (item: CartItem) => {
        const key = `${item.bodegaId ?? ""}:${item.productId}`;
        const existing = map.get(key);
        if (!existing) {
            map.set(key, item);
            return;
        }
        const qty = Math.max(existing.qty, item.qty);
        map.set(key, { ...existing, ...item, qty });
    };
    primary.forEach(add);
    fallback.forEach(add);
    return Array.from(map.values());
};

export function AppProviders({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    const [items, setItems] = useState<CartItem[]>([]);

    useEffect(() => {
        setMounted(true);
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const stored = raw ? (JSON.parse(raw) as CartItem[]) : [];
            const legacy = readLegacyCarts();
            if (stored.length > 0 || legacy.length > 0) {
                setItems(mergeItems(stored, legacy));
            } else {
                setItems([]);
            }
        } catch {
            setItems(readLegacyCarts());
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
            // ignore
        }
        const grouped = new Map<string, CartItem[]>();
        items.forEach((item) => {
            if (!item.bodegaId) return;
            const list = grouped.get(item.bodegaId) ?? [];
            list.push(item);
            grouped.set(item.bodegaId, list);
        });

        const legacyKeys = new Set<string>();
        if (typeof window !== "undefined") {
            for (let i = 0; i < window.localStorage.length; i += 1) {
                const key = window.localStorage.key(i) || "";
                if (key.startsWith("pedido:")) {
                    legacyKeys.add(key.replace("pedido:", "").trim());
                }
            }
        }

        grouped.forEach((list, bodegaId) => {
            const legacyItems = list.map((item) => ({
                productoId: item.productId,
                quantity: item.qty,
            }));
            saveCart(bodegaId, legacyItems as any);
            legacyKeys.delete(bodegaId);
        });

        legacyKeys.forEach((bodegaId) => {
            if (!bodegaId) return;
            clearCart(bodegaId);
        });
    }, [items, mounted]);

    const api = useMemo<CartState>(() => {
        const addItem: CartState["addItem"] = (item, qty = 1) => {
            setItems((prev) => {
                const idx = prev.findIndex((x) => x.productId === item.productId);
                if (idx >= 0) {
                    const next = [...prev];
                    next[idx] = { ...next[idx], qty: next[idx].qty + qty };
                    return next;
                }
                return [...prev, { ...item, qty }];
            });
        };

        const removeItem: CartState["removeItem"] = (productId) => {
            setItems((prev) => prev.filter((x) => x.productId !== productId));
        };

        const setQty: CartState["setQty"] = (productId, qty) => {
            const q = Math.max(1, Math.min(999, qty));
            setItems((prev) =>
                prev.map((x) => (x.productId === productId ? { ...x, qty: q } : x))
            );
        };

        const clear = () => setItems([]);

        const total = items.reduce((sum, x) => sum + x.price * x.qty, 0);
        const count = items.reduce((sum, x) => sum + x.qty, 0);

        return { items, addItem, removeItem, setQty, clear, total, count };
    }, [items]);

    return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used inside AppProviders");
    return ctx;
}
