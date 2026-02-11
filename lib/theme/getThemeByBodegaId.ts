import fs from "fs/promises";
import path from "path";
import type { ThemeConfig, ThemeTokens } from "./themeTypes";

const DEFAULT_THEME: ThemeTokens = {
  brand: {
    primary: "#0f172a",
    secondary: "#1e293b",
    accent: "#38bdf8",
  },
  surface: {
    bg: "#f8fafc",
    card: "#ffffff",
    border: "#e2e8f0",
  },
  text: {
    strong: "#0f172a",
    normal: "#1f2937",
    muted: "#6b7280",
  },
  ui: {
    buttonRadius: "0.5rem",
    cardRadius: "0.75rem",
    shadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  },
  effects: {
    gradient: "linear-gradient(135deg, #0ea5e9, #22d3ee)",
    pattern: "none",
    logoGlow: "0 0 20px rgba(56, 189, 248, 0.4)",
  },
};

const THEMES_PATH = path.join(process.cwd(), "data", "themes.json");

export async function getThemeByBodegaId(
  bodegaId: string,
): Promise<ThemeTokens> {
  try {
    const content = await fs.readFile(THEMES_PATH, "utf8");
    const themes = JSON.parse(content) as ThemeConfig[];
    const found = themes.find((t) => t.bodegaId === bodegaId);
    return found?.theme ?? DEFAULT_THEME;
  } catch (err) {
    if ((err as any).code !== "ENOENT") {
      console.warn("No se pudo leer data/themes.json, usando tema por defecto", err);
    }
    return DEFAULT_THEME;
  }
}

export { DEFAULT_THEME };
