export type TenderoProfile = {
    id: string;
    nombre_tienda: string;
    ciudad?: string;
    telefono?: string;
    photoDataUrl?: string;
    createdAt: string;
    ia_result?: {
        resumen: string;
        recomendaciones: string[];
        mejoras: { categoria: string; items: string[] }[];
        etiquetas: string[];
    };
};

const STORAGE_KEY = "tendero_profile";

export function getTenderoProfile(): TenderoProfile | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.error("Error reading tendero profile", e);
        return null;
    }
}

export function setTenderoProfile(profile: TenderoProfile): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
        console.error("Error saving tendero profile", e);
    }
}

export function clearTenderoProfile(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
}