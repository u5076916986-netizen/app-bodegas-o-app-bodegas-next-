const STORAGE_KEY = "cupon_activo";

const normalize = (code: string) => code.trim().toUpperCase();

export function getCuponActivo(): string {
  if (typeof window === "undefined") {
    return "";
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return "";
  return normalize(raw);
}

export function setCuponActivo(code: string): void {
  if (typeof window === "undefined") {
    return;
  }
  const normalized = normalize(code);
  if (!normalized) {
    clearCuponActivo();
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, normalized);
}

export function clearCuponActivo(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
}
