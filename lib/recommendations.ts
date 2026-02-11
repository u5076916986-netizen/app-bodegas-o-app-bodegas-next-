export type PromoRule = {
    bodegaId: string;
    estado?: string;
    fechaInicio?: string;
    fechaFin?: string;
    aplicaA?: string;
    categoriaProductos?: string[];
    productosIds?: string[];
};

export type RecommendationItem = {
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

const BASIC_CATEGORIES = ["ASEO", "BEBIDAS", "SNACKS", "LACTEOS", "PANADERIA", "ALIMENTOS", "LIMPIEZA"];

const getPrice = (item: RecommendationItem) =>
    Number(item.precio_cop ?? item.precio ?? 0);

const isPromoActive = (promo: PromoRule, now: Date) => {
    if (promo.estado && !["activa", "programada"].includes(promo.estado)) return false;
    const start = promo.fechaInicio ? new Date(promo.fechaInicio) : null;
    const end = promo.fechaFin ? new Date(promo.fechaFin) : null;
    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
};

export const buildRecommendations = (
    catalog: RecommendationItem[],
    faltante: number,
    cartIds: Set<string>,
    promos: PromoRule[],
    now: Date,
    maxItems = 6,
) => {
    const activePromos = promos.filter((promo) => isPromoActive(promo, now));
    const promoCategories = new Set(
        activePromos.flatMap((p) => (p.categoriaProductos || []).map((c) => c.toLowerCase())),
    );
    const promoProducts = new Set(activePromos.flatMap((p) => p.productosIds || []));

    const eligible = catalog
        .filter((item) => item.activo !== false)
        .filter((item) => getPrice(item) > 0)
        .filter((item) => !cartIds.has(item.id))
        .map((item) => {
            const price = getPrice(item);
            const categoria = (item.categoria || "").toLowerCase();
            const isPromo = promoProducts.has(item.id) || (categoria && promoCategories.has(categoria));
            return { ...item, price, isPromo };
        });

    const sorted = eligible.sort((a, b) => {
        if (a.isPromo !== b.isPromo) return a.isPromo ? -1 : 1;
        const aUnder = a.price <= faltante;
        const bUnder = b.price <= faltante;
        if (aUnder !== bUnder) return aUnder ? -1 : 1;
        const aDiff = Math.abs(faltante - a.price);
        const bDiff = Math.abs(faltante - b.price);
        if (aDiff !== bDiff) return aDiff - bDiff;
        return a.price - b.price;
    });

    const picked: typeof sorted = [];
    const used = new Set<string>();

    BASIC_CATEGORIES.forEach((category) => {
        const match = sorted.find(
            (item) => !used.has(item.id) && (item.categoria || "").toUpperCase().includes(category),
        );
        if (match) {
            picked.push(match);
            used.add(match.id);
        }
    });

    for (const item of sorted) {
        if (picked.length >= maxItems) break;
        if (used.has(item.id)) continue;
        picked.push(item);
        used.add(item.id);
    }

    return picked;
};

export const hasActivePromos = (promos: PromoRule[], now: Date) =>
    promos.some((promo) => isPromoActive(promo, now));
