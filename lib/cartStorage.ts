export function getCartKey(bodegaId: string): string {
  return `pedido:${(bodegaId || "").trim()}`;
}
