const POINTS_STORAGE_KEY = "tendero_puntos";
const ORDER_FLAG_PREFIX = "puntos_aplicados_";

const safeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getWindow = () => (typeof window !== "undefined" ? window : null);

export function getPuntos(): number {
  const win = getWindow();
  if (!win) return 0;
  const raw = win.localStorage.getItem(POINTS_STORAGE_KEY);
  return safeNumber(raw);
}

export function setPuntos(next: number): number {
  const win = getWindow();
  if (!win) return next;
  const value = Math.max(0, Number.isFinite(next) ? next : 0);
  win.localStorage.setItem(POINTS_STORAGE_KEY, value.toString());
  return value;
}

export function addPuntos(delta: number): number {
  const win = getWindow();
  if (!win) return safeNumber(delta);
  const current = getPuntos();
  const next = Math.max(0, current + safeNumber(delta));
  win.localStorage.setItem(POINTS_STORAGE_KEY, next.toString());
  return next;
}

export function hasPuntosAplicados(pedidoId: string): boolean {
  if (!pedidoId) return false;
  const win = getWindow();
  if (!win) return false;
  return win.localStorage.getItem(`${ORDER_FLAG_PREFIX}${pedidoId}`) === "1";
}

export function markPuntosAplicados(pedidoId: string): void {
  if (!pedidoId) return;
  const win = getWindow();
  if (!win) return;
  win.localStorage.setItem(`${ORDER_FLAG_PREFIX}${pedidoId}`, "1");
}
