import Fuse from "fuse.js";
import { normalizeText } from "@/lib/normalize";

export function buildFuseIndex<T extends Record<string, any>>(items: T[]) {
    const prepared = items.map((p) => ({
        ...p,
        __search: normalizeText(
            `${p.nombre ?? ""} ${p.sku ?? ""} ${p.categoria ?? ""} ${p.marca ?? ""} ${Array.isArray(p.tags) ? p.tags.join(" ") : ""
            } ${p.unidad ?? ""} ${p.presentacion ?? ""} ${p.producto_id ?? ""}`,
        ),
    }));

    const fuse = new Fuse(prepared, {
        keys: ["__search"],
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 2,
    });

    return { fuse, prepared };
}

export function smartSearch<T extends Record<string, any>>(
    fuse: Fuse<T>,
    query: string,
    limit = 30,
) {
    const q = normalizeText(query);
    if (!q) return [] as T[];
    return fuse.search(q, { limit }).map((r) => r.item);
}
