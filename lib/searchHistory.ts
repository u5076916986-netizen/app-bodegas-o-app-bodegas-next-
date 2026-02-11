type ClickRecord = {
    kind: "producto" | "bodega";
    id: string;
    label: string;
    at: number;
};

function key(base: string, role?: string) {
    return `${base}:v1:${role ?? "global"}`;
}

export function addQuery(role: string | undefined, q: string) {
    if (typeof window === "undefined") return;
    const k = key("search_history_queries", role);
    try {
        const raw = window.localStorage.getItem(k);
        const arr: string[] = raw ? JSON.parse(raw) : [];
        const normalized = q.trim();
        if (!normalized) return;
        const dedup = [normalized, ...arr.filter((x) => x !== normalized)].slice(0, 8);
        window.localStorage.setItem(k, JSON.stringify(dedup));

        // increment counter for trends
        const ctrK = key("search_trends_ctr", role);
        const rawCtr = window.localStorage.getItem(ctrK);
        const ctr = rawCtr ? JSON.parse(rawCtr) : {};
        ctr[normalized] = (ctr[normalized] || 0) + 1;
        window.localStorage.setItem(ctrK, JSON.stringify(ctr));
    } catch (err) {
        console.warn("searchHistory.addQuery", err);
    }
}

export function addClick(role: string | undefined, kind: "producto" | "bodega", id: string, label: string) {
    if (typeof window === "undefined") return;
    const k = key("search_history_clicks", role);
    try {
        const raw = window.localStorage.getItem(k);
        const arr: ClickRecord[] = raw ? JSON.parse(raw) : [];
        const record: ClickRecord = { kind, id, label, at: Date.now() };
        const next = [record, ...arr.filter((c) => !(c.kind === kind && c.id === id))].slice(0, 5);
        window.localStorage.setItem(k, JSON.stringify(next));
    } catch (err) {
        console.warn("searchHistory.addClick", err);
    }
}

export function addCategoryUse(role: string | undefined, category: string) {
    if (typeof window === "undefined") return;
    const k = key("search_cat_ctr", role);
    try {
        const raw = window.localStorage.getItem(k);
        const ctr = raw ? JSON.parse(raw) : {};
        ctr[category] = (ctr[category] || 0) + 1;
        window.localStorage.setItem(k, JSON.stringify(ctr));
    } catch (err) {
        console.warn("searchHistory.addCategoryUse", err);
    }
}

export function getHistory(role: string | undefined) {
    if (typeof window === "undefined") return { queries: [], clicks: [], trends: [], categories: [] };
    try {
        const qk = key("search_history_queries", role);
        const ck = key("search_history_clicks", role);
        const tK = key("search_trends_ctr", role);
        const cK = key("search_cat_ctr", role);
        const queries = JSON.parse(window.localStorage.getItem(qk) || "[]");
        const clicks = JSON.parse(window.localStorage.getItem(ck) || "[]");
        const trendsRaw = JSON.parse(window.localStorage.getItem(tK) || "{}");
        const catsRaw = JSON.parse(window.localStorage.getItem(cK) || "{}");

        const trends = Object.entries(trendsRaw)
            .sort((a: any, b: any) => b[1] - a[1])
            .slice(0, 8)
            .map((e) => e[0]);
        const categories = Object.entries(catsRaw)
            .sort((a: any, b: any) => b[1] - a[1])
            .slice(0, 8)
            .map((e) => e[0]);

        return { queries, clicks, trends, categories };
    } catch (err) {
        console.warn("searchHistory.getHistory", err);
        return { queries: [], clicks: [], trends: [], categories: [] };
    }
}

export function clearHistory(role: string | undefined) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem(key("search_history_queries", role));
        window.localStorage.removeItem(key("search_history_clicks", role));
    } catch (err) {
        console.warn("searchHistory.clearHistory", err);
    }
}

export type { ClickRecord };
