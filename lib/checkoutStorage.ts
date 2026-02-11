export type CheckoutDraftItem = {
    productoId: string;
    nombre: string;
    precio: number;
    quantity: number;
    sku?: string;
};

export type CheckoutDraft = {
    bodegaId: string;
    bodegaNombre?: string;
    minimoPedido?: number | null;
    items: CheckoutDraftItem[];
    nombre?: string;
    telefono?: string;
    direccion?: string;
    pagoConfirmado?: boolean;
    updatedAt: string;
};

const CHECKOUT_DRAFT_KEY = "checkout_draft";

export function saveCheckoutDraft(draft: CheckoutDraft): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
}

export function readCheckoutDraft(): CheckoutDraft | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(CHECKOUT_DRAFT_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as CheckoutDraft;
    } catch {
        return null;
    }
}

export function clearCheckoutDraft(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(CHECKOUT_DRAFT_KEY);
}
