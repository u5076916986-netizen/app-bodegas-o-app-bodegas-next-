export function normalizeQ(s?: string) {
    return (s ?? "").toString().toLowerCase().trim();
}

export function buildSearchUrl(base = "/api/buscar", params: Record<string, any>) {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", String(params.q));
    if (params.category) qs.set("category", String(params.category));
    if (params.bodegaId) qs.set("bodegaId", String(params.bodegaId));
    if (params.zona) qs.set("zona", String(params.zona));
    if (params.sort) qs.set("sort", String(params.sort));
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.offset) qs.set("offset", String(params.offset));
    return `${base}?${qs.toString()}`;
}

export function parseSort(s?: string) {
    const v = (s ?? "").toLowerCase();
    if (v === "precio_asc" || v === "precio_desc") return v;
    return "relevancia";
}
