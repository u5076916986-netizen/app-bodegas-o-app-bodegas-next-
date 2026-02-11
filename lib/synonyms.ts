import sinonimos from "@/data/sinonimos.json";
import { normalizeText } from "@/lib/normalize";

export type SynonymsMap = Record<string, string[]>;

const defaultSynonyms = sinonimos as SynonymsMap;

export function expandQuery(input: string, synonyms: SynonymsMap = defaultSynonyms) {
    const base = normalizeText(input);
    if (!base) return "";
    const words = base.split(" ");
    const extra: string[] = [];

    for (const word of words) {
        for (const [key, values] of Object.entries(synonyms)) {
            const keyNorm = normalizeText(key);
            const valsNorm = (values || []).map((v) => normalizeText(String(v)));
            if (word === keyNorm || valsNorm.includes(word)) {
                extra.push(keyNorm, ...valsNorm);
            }
        }
    }

    const merged = Array.from(new Set([base, ...extra])).join(" ");
    return merged.replace(/\s+/g, " ").trim();
}
