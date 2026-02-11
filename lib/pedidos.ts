// Re-export types and validation from pedidos.types
export type { Pedido } from "./pedidos.types";
export { EstadoPedido, isValidStateTransition } from "./pedidos.types";

// Server-only functions must be imported from pedidos.server in server contexts
// Client components should only use the type and enum exports above
