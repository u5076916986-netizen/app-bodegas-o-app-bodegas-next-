import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { getProductos, getBodegaById } from "@/lib/csv";
import { normalizeText } from "@/lib/normalize";
import { expandQuery } from "@/lib/synonyms";
import { buildFuseIndex } from "@/lib/smartSearch";
import { getCupones } from "@/lib/cupones.server";
export const runtime = "nodejs";

// === Utility Functions ===

/**
 * Tokenize normalized text
 */
function tokenize(q: string): string[] {
    return normalizeText(q)
        .split(/\s+/)
        .filter(Boolean);
}

/**
 * Levenshtein distance (simple, O(nm))
 */
function levenshtein(a: string, b: string): number {
    const an = a.length;
    const bn = b.length;
    if (an === 0) return bn;
    if (bn === 0) return an;

    const dp = Array(bn + 1)
        .fill(0)
        .map(() => Array(an + 1).fill(0));
    for (let i = 0; i <= an; i++) dp[0][i] = i;
    for (let j = 0; j <= bn; j++) dp[j][0] = j;

    for (let j = 1; j <= bn; j++) {
        for (let i = 1; i <= an; i++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[j][i] = Math.min(
                dp[j][i - 1] + 1, // insert
                dp[j - 1][i] + 1, // delete
                dp[j - 1][i - 1] + cost // replace
            );
        }
    }
    return dp[bn][an];
}

/**
 * Score a single product against query tokens
 * Scoring logic:
 *  - exact match of full query: +10
 *  - token startsWith query start: +5
 *  - token includes token: +4 (base)
 *  - token startsWith token: +2 (bonus)
 *  - category match: +1
 *  - stock bonus (>50: +2, >100: +3): helps tie-breaker (ONLY if there's a match)
 */
const buildPedidosCountMap = async () => {
    try {
        const dataPath = join(process.cwd(), "data", "pedidos.json");
        const raw = await readFile(dataPath, "utf-8");
        const pedidos = JSON.parse(raw) as Array<Record<string, any>>;
        const counts = new Map<string, number>();
        pedidos.forEach((pedido) => {
            const items = Array.isArray(pedido?.items) ? pedido.items : [];
            items.forEach((item: any) => {
                const productoId = String(item?.productoId ?? item?.productId ?? "").trim();
                if (!productoId) return;
                const qty = Number(item?.cantidad ?? item?.quantity ?? 0) || 0;
                counts.set(productoId, (counts.get(productoId) || 0) + qty);
            });
        });
        return counts;
    } catch {
        return new Map<string, number>();
    }
};

const buildCuponBodegaSet = async () => {
    const cupones = await getCupones();
    const now = new Date().toISOString();
    const set = new Set<string>();
    cupones.forEach((c) => {
        if (!c.active) return;
        if (c.startDate && c.startDate > now) return;
        if (c.endDate && c.endDate < now) return;
        if (c.bodegaId) set.add(c.bodegaId);
    });
    return set;
};

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const q = (url.searchParams.get("q") || "").trim();
        const category = url.searchParams.get("category") || undefined;
        const bodegaId = url.searchParams.get("bodegaId") || undefined;
        const zona = url.searchParams.get("zona") || undefined;
        const limit = url.searchParams.get("limit") ? Math.max(1, Math.min(500, Number(url.searchParams.get("limit")))) : 50;
        const offset = url.searchParams.get("offset") ? Math.max(0, Number(url.searchParams.get("offset"))) : 0;
        const minPrice = url.searchParams.get("minPrice")
            ? Number(url.searchParams.get("minPrice"))
            : undefined;
        const maxPrice = url.searchParams.get("maxPrice")
            ? Number(url.searchParams.get("maxPrice"))
            : undefined;
        const sort = (url.searchParams.get("sort") || "relevancia").toLowerCase();

        const productos = await getProductos();
        const ventasMap = await buildPedidosCountMap();
        const cuponBodegaSet = await buildCuponBodegaSet();

        // Normalize and tokenize query
        const normalizedQuery = normalizeText(q);
        const expandedQuery = expandQuery(normalizedQuery);
        const queryTokens = tokenize(expandedQuery);
        const allTokens = Array.from(new Set(queryTokens)).slice(0, 12);

        const filteredProductos = productos.filter((producto) => {
            if (bodegaId && producto.bodega_id !== bodegaId) return false;
            if (category && producto.categoria !== category) return false;
            if (typeof minPrice === "number" && producto.precio_cop !== null && producto.precio_cop < minPrice) return false;
            if (typeof maxPrice === "number" && producto.precio_cop !== null && producto.precio_cop > maxPrice) return false;
            return true;
        });

        const candidates: string[] = [];
        filteredProductos.forEach((p) => {
            if (allTokens.length > 0) candidates.push(normalizeText(p.nombre));
        });

        const { fuse, prepared } = buildFuseIndex(
            filteredProductos.map((p) => ({
                ...p,
                sku: p.producto_id,
                presentacion: p.unidad,
                tags: [],
            })),
        );

        const fuseResults = allTokens.length > 0
            ? fuse.search(expandedQuery, { limit: 200 })
            : prepared.map((item, index) => ({ item, score: 0.9 + index * 0.0001 }));

        const results: Array<any> = [];

        for (const r of fuseResults) {
            const producto = r.item as any;
            const baseScore = r.score !== undefined ? Math.max(0, 1 - r.score) * 10 : 0;
            let score = baseScore;

            const stock = producto.stock ?? 0;
            if (stock > 100) score += 3;
            else if (stock > 50) score += 2;
            else if (stock > 0) score += 1;

            const ventas = ventasMap.get(String(producto.producto_id)) ?? 0;
            if (ventas > 0) score += Math.min(5, Math.log10(ventas + 1) * 3);

            if (cuponBodegaSet.has(String(producto.bodega_id))) score += 2;

            const bodega = await getBodegaById(producto.bodega_id);
            if (zona && bodega && bodega.zona !== zona) continue;
            if (zona && bodega && bodega.zona === zona) score += 1;

            if (allTokens.length > 0 && baseScore === 0) continue;

            results.push({
                producto,
                bodega,
                score,
                matchHighlights: allTokens,
            });
        }

        // Sort by relevance first (score), then by stock (tiebreaker)
        if (sort === "relevancia") {
            results.sort((a, b) => {
                const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
                if (scoreDiff !== 0) return scoreDiff;
                return (b.producto.stock ?? 0) - (a.producto.stock ?? 0);
            });
        } else if (sort === "precio_asc") {
            // Sort by price ascending, but keep relevance as secondary sort
            results.sort((a, b) => {
                const priceDiff = (a.producto.precio_cop ?? 0) - (b.producto.precio_cop ?? 0);
                if (priceDiff !== 0) return priceDiff;
                return (b.score ?? 0) - (a.score ?? 0);
            });
        } else if (sort === "precio_desc") {
            results.sort((a, b) => {
                const priceDiff = (b.producto.precio_cop ?? 0) - (a.producto.precio_cop ?? 0);
                if (priceDiff !== 0) return priceDiff;
                return (b.score ?? 0) - (a.score ?? 0);
            });
        }

        const total = results.length;

        // === Did-You-Mean Logic ===
        let didYouMean: string[] = [];
        if ((total === 0 || total < 3) && allTokens.length > 0 && normalizedQuery) {
            // Find candidates with low Levenshtein distance
            const candidateDistances = candidates
                .slice(0, 200) // evaluate top 200 only
                .map((c) => {
                    const dist = levenshtein(normalizedQuery, c);
                    return { candidate: c, distance: dist };
                })
                .filter((x) => {
                    // threshold: distance <= 2 for short queries, <= 3 for longer
                    const threshold = normalizedQuery.length <= 5 ? 2 : 3;
                    return x.distance <= threshold && x.distance > 0;
                })
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 3) // max 3 suggestions
                .map((x) => x.candidate);

            didYouMean = Array.from(new Set(candidateDistances));
        }

        // Paging
        const paged = results.slice(offset, offset + limit);

        // Map to consistent item shape
        const items = paged.map((r) => {
            const p = r.producto;
            const b = r.bodega;
            return {
                productId: p.producto_id,
                nombre: p.nombre,
                categoria: p.categoria,
                precio: p.precio_cop ?? null,
                stock: p.stock ?? null,
                bodegaId: b?.bodega_id ?? p.bodega_id ?? null,
                bodegaNombre: b?.nombre ?? null,
                ciudad: b?.ciudad ?? null,
                zona: b?.zona ?? null,
                tags: [],
            };
        });

        // Facets
        const facets = { categorias: new Set<string>(), bodegas: new Set<string>(), zonas: new Set<string>() };
        for (const r of results) {
            if (r.producto?.categoria) facets.categorias.add(r.producto.categoria);
            if (r.bodega) facets.bodegas.add(`${r.bodega.bodega_id}::${r.bodega.nombre}`);
            if (r.bodega?.zona) facets.zonas.add(r.bodega.zona);
        }

        return NextResponse.json({
            ok: true,
            q,
            total,
            limit,
            offset,
            items,
            facets: {
                categorias: Array.from(facets.categorias).sort(),
                bodegas: Array.from(facets.bodegas).map((v) => {
                    const [id, nombre] = v.split("::");
                    return { id, nombre };
                }),
                zonas: Array.from(facets.zonas).sort(),
            },
            meta: {
                expandedTokens: allTokens.length > 0 ? allTokens : undefined,
                didYouMean: didYouMean.length > 0 ? didYouMean : undefined,
            },
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ ok: false, error: "Error en búsqueda" }, { status: 500 });
    }
}
