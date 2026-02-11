import fs from "fs/promises";
import path from "path";

export type BodegaTheme = {
  primary: string;      // Color principal (bordes fuertes, botones)
  primarySoft: string;  // Color suave (fondos sutiles)
  border: string;       // Color de bordes de separación
  badgeBg: string;      // Fondo para badges/etiquetas
  badgeText: string;    // Texto para badges
  headerBg?: string;    // Fondo del header (opcional)
  logoUrl?: string;     // URL del logo (opcional)
  logo?: string;        // Nombre de archivo o clave del logo personalizado
  brand?: {
    accent?: string;
    [key: string]: string | undefined;
  };
  accent: string;       // Color de acento para enlaces y bordes destacados
};

export const DEFAULT_BODEGA_THEME: BodegaTheme = {
  primary: "#334155",
  primarySoft: "#f8fafc",
  border: "#e2e8f0",
  badgeBg: "#f1f5f9",
  badgeText: "#475569",
  headerBg: "#ffffff",
  accent: "#1d4ed8",
};

const THEMES_PATH = path.join(process.cwd(), "data", "bodegas_themes.json");

async function readThemesFile(): Promise<Record<string, BodegaTheme>> {
  try {
    const raw = await fs.readFile(THEMES_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Record<string, BodegaTheme>;
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch (err) {
    console.warn("No se pudo leer data/bodegas_themes.json, usando default", err);
  }
  return {};
}

export async function getBodegasThemeMap(): Promise<
  Record<string, BodegaTheme>
> {
  const themes = await readThemesFile();
  const base = themes.DEFAULT ? { ...DEFAULT_BODEGA_THEME, ...themes.DEFAULT } : DEFAULT_BODEGA_THEME;

  const merged: Record<string, BodegaTheme> = {};
  // Asegurar que cada tema definido tenga todos los campos del default
  for (const key in themes) {
    merged[key] = { ...base, ...themes[key] };
  }
  merged.DEFAULT = base;
  return merged;
}

export async function getThemeForBodega(
  bodegaId: string,
): Promise<BodegaTheme> {
  const themes = await readThemesFile();
  const base = themes.DEFAULT ? { ...DEFAULT_BODEGA_THEME, ...themes.DEFAULT } : DEFAULT_BODEGA_THEME;
  const specific = themes[bodegaId];
  return specific ? { ...base, ...specific } : base;
}
