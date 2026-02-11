type ItemConPrecio = {
  producto?: {
    precio_cop?: number | null;
    puntos_base?: number; // Preservamos esta propiedad por si aparece en CSV.
    precio_unitario_cop?: number | null;
    [key: string]: any;
  };
  quantity?: number | null;
  cantidad?: number | null;
  puntos_base?: number | null;
  precio_cop?: number | null;
  precio_unitario_cop?: number | null;
} | null | undefined;

export function calcPuntosPedido(items: ItemConPrecio[], totalFinal: number): number {
  let puntosAcumulados = 0;
  let valorBaseParaPuntos = 0;
  let totalLista = 0;

  for (const line of items) {
    if (!line) continue;
    const viaProducto = line.producto ?? line;
    const qty = Number(line.quantity ?? line.cantidad ?? 0);
    const precio = Number(
      viaProducto?.precio_cop ??
        viaProducto?.precio_unitario_cop ??
        line.precio_cop ??
        line.precio_unitario_cop ??
        0,
    );
    const subtotal = precio * qty;

    totalLista += subtotal;

    if (typeof viaProducto?.puntos_base === "number" && viaProducto.puntos_base > 0) {
      puntosAcumulados += viaProducto.puntos_base * qty;
    } else {
      valorBaseParaPuntos += subtotal;
    }
  }

  // Regla fallback: 1 punto cada 10.000 COP del valor pagado (proporcional al descuento)
  const factorPago = totalLista > 0 ? totalFinal / totalLista : 0;
  const valorPagadoSinPuntosBase = valorBaseParaPuntos * factorPago;

  puntosAcumulados += Math.floor(valorPagadoSinPuntosBase / 10000);

  return Math.floor(puntosAcumulados);
}
