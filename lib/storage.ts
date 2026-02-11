/**
 * Storage helper para MVP sin auth real.
 * Maneja datos en localStorage de forma type-safe.
 */

export const TENDERO_PHONE_KEY = "mvp_tendero_phone";
export const CURRENT_BODEGA_KEY = "mvp_current_bodega";

export function saveTenderoPhone(phone: string): void {
  if (typeof window === "undefined") return;
  const normalized = phone.replace(/[\s\-\(\)]/g, "").trim();
  localStorage.setItem(TENDERO_PHONE_KEY, normalized);
}

export function getTenderoPhone(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TENDERO_PHONE_KEY);
}

export function saveBodegaId(bodegaId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CURRENT_BODEGA_KEY, bodegaId);
}

export function getBodegaId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURRENT_BODEGA_KEY);
}

export function clearMVPStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TENDERO_PHONE_KEY);
  localStorage.removeItem(CURRENT_BODEGA_KEY);
}
