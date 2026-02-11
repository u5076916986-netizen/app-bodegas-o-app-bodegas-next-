export type CatalogItem = {
    id: string;
    bodegaId: string;
    nombre: string;
    categoria?: string;
    precio?: number;
    precio_cop?: number;
    stock?: number;
    activo?: boolean;
    sku?: string;
};

const getCatalogKey = (bodegaId: string) => `catalogo:${(bodegaId || "").trim()}`;

export const saveCatalogSnapshot = (bodegaId: string, items: CatalogItem[]) => {
    if (typeof window === "undefined") return;
    if (!bodegaId) return;
    try {
        window.localStorage.setItem(getCatalogKey(bodegaId), JSON.stringify(items));
    } catch {
        // ignore
    }
};

export const readCatalogSnapshot = (bodegaId: string): CatalogItem[] => {
    if (typeof window === "undefined") return [];
    if (!bodegaId) return [];
    try {
        const raw = window.localStorage.getItem(getCatalogKey(bodegaId));
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as CatalogItem[]) : [];
    } catch {
        return [];
    }
};
