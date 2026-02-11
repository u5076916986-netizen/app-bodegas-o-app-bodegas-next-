export type Cupon = {
  id: string;
  code: string;
  bodegaId: string | null;
  type: "fixed" | "percent";
  value: number;
  minSubtotal?: number;
  active: boolean;
  startDate?: string;
  endDate?: string;
};

const now = () => new Date();

export function validateCupon(
  cupones: Cupon[],
  code: string,
  bodegaId: string,
  subtotal: number
): { ok: boolean; descuentoCOP: number; reason?: string; cupon?: Cupon } {
  const normalizedCode = code.trim().toUpperCase();
  const found = cupones.find((c) => c.code.toUpperCase() === normalizedCode);

  if (!found) return { ok: false, descuentoCOP: 0, reason: "Cupón no existe" };
  if (!found.active) return { ok: false, descuentoCOP: 0, reason: "Cupón inactivo" };
  if (found.bodegaId && found.bodegaId !== bodegaId)
    return { ok: false, descuentoCOP: 0, reason: "Cupón no válido para esta bodega" };

  const min = found.minSubtotal ?? 0;
  if (subtotal < min)
    return { ok: false, descuentoCOP: 0, reason: `Mínimo de compra: $${min}` };

  const ahora = now();
  if (found.startDate) {
    const inicio = new Date(found.startDate);
    if (inicio.getTime() > ahora.getTime()) {
      return { ok: false, descuentoCOP: 0, reason: "Cupón no disponible todavía" };
    }
  }
  if (found.endDate) {
    const fin = new Date(found.endDate);
    if (fin.getTime() < ahora.getTime()) {
      return { ok: false, descuentoCOP: 0, reason: "Cupón vencido" };
    }
  }

  let descuento = 0;
  if (found.type === "percent") {
    descuento = (subtotal * found.value) / 100;
  } else {
    descuento = found.value;
  }

  // El descuento no puede exceder el subtotal
  return {
    ok: true,
    descuentoCOP: Math.min(descuento, subtotal),
    cupon: found,
  };
}
