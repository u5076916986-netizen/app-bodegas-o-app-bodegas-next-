import { getCartKey } from "@/lib/cartStorage";

export type CartItem = {
  productoId: string;
  nombre?: string;
  precio?: number;
  precio_cop?: number;
  sku?: string;
  cantidad?: number;
  quantity?: number;
};

export type Cart = {
  bodegaId: string;
  items: CartItem[];
};

const LAST_ACTIVE_BODEGA_KEY = "lastActiveBodegaId";

const normalizeQty = (item: CartItem) => {
  const qty = Number(item.cantidad ?? item.quantity ?? 0);
  return Number.isFinite(qty) ? qty : 0;
};

const readCart = (bodegaId: string): CartItem[] => {
  if (typeof window === "undefined") return [];
  const key = getCartKey(bodegaId);
  const raw = window.localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
};

const writeCart = (bodegaId: string, items: CartItem[]) => {
  if (typeof window === "undefined") return;
  const key = getCartKey(bodegaId);
  window.localStorage.setItem(key, JSON.stringify(items));
};

export const setActiveBodega = (bodegaId: string) => {
  if (typeof window === "undefined") return;
  if (!bodegaId) return;
  window.localStorage.setItem(LAST_ACTIVE_BODEGA_KEY, bodegaId);
};

export const getActiveBodega = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LAST_ACTIVE_BODEGA_KEY);
};

export const listCarts = (): Cart[] => {
  if (typeof window === "undefined") return [];
  const carts: Cart[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i) || "";
    if (!key.startsWith("pedido:")) continue;
    const bodegaId = key.replace("pedido:", "");
    const items = readCart(bodegaId);
    carts.push({ bodegaId, items });
  }
  return carts;
};

export const getActiveCart = (preferredBodegaId?: string) => {
  if (typeof window === "undefined") return { cart: null as Cart | null, bodegaId: null as string | null };
  const carts = listCarts().filter((cart) => cart.items.length > 0);
  const preferred = preferredBodegaId?.trim();
  if (preferred) {
    const items = readCart(preferred);
    return { cart: { bodegaId: preferred, items }, bodegaId: preferred };
  }
  const lastActive = getActiveBodega();
  if (lastActive) {
    const items = readCart(lastActive);
    if (items.length > 0) {
      return { cart: { bodegaId: lastActive, items }, bodegaId: lastActive };
    }
  }
  const fallback = carts[0];
  if (fallback) {
    return { cart: fallback, bodegaId: fallback.bodegaId };
  }
  return { cart: null, bodegaId: null };
};

export const saveCart = (bodegaId: string, items: CartItem[]) => {
  writeCart(bodegaId, items);
  setActiveBodega(bodegaId);
};

export const getCart = (bodegaId: string): CartItem[] => {
  return readCart(bodegaId);
};

export const addItem = (bodegaId: string, item: CartItem): CartItem[] => {
  const items = readCart(bodegaId);
  const qty = Math.max(1, normalizeQty(item));
  const index = items.findIndex((i) => i.productoId === item.productoId);
  if (index >= 0) {
    const current = normalizeQty(items[index]);
    items[index] = { ...items[index], ...item, quantity: current + qty };
  } else {
    items.push({ ...item, quantity: qty });
  }
  saveCart(bodegaId, items);
  return items;
};

export const updateQty = (bodegaId: string, productoId: string, quantity: number): CartItem[] => {
  const items = readCart(bodegaId)
    .map((item) =>
      item.productoId === productoId ? { ...item, quantity } : item,
    )
    .filter((item) => normalizeQty(item) > 0);
  saveCart(bodegaId, items);
  return items;
};

export const removeItem = (bodegaId: string, productoId: string): CartItem[] => {
  const items = readCart(bodegaId).filter((item) => item.productoId !== productoId);
  saveCart(bodegaId, items);
  return items;
};

export const clearCart = (bodegaId: string) => {
  if (typeof window === "undefined") return;
  const key = getCartKey(bodegaId);
  window.localStorage.removeItem(key);
};
