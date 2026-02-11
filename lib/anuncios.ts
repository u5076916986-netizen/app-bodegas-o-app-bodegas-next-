export type Placement = "home" | "catalogo" | "carrito" | "confirmar";

export type Anuncio = {
  id: string;
  bodegaId?: string | null;
  titulo: string;
  imagenUrl: string;
  activo: boolean;
  prioridad: number;
  placements: Placement[];
  ctaTexto?: string;
  ctaHref?: string;
  startDate?: string;
  endDate?: string;
};

export const PLACEMENTS: Placement[] = ["home", "catalogo", "carrito", "confirmar"];

export const isPlacement = (value: unknown): value is Placement =>
  typeof value === "string" && PLACEMENTS.includes(value as Placement);
