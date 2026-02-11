/* eslint-disable no-console */
import fs from "fs/promises";
import path from "path";
import process from "process";
import { OpenAI } from "openai";
import { z } from "zod";
import type { ThemeConfig, ThemeTokens } from "../lib/theme/themeTypes";

const themeSchema: z.ZodType<ThemeTokens> = z.object({
  brand: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
  }),
  surface: z.object({
    bg: z.string(),
    card: z.string(),
    border: z.string(),
  }),
  text: z.object({
    strong: z.string(),
    normal: z.string(),
    muted: z.string(),
  }),
  ui: z.object({
    buttonRadius: z.string(),
    cardRadius: z.string(),
    shadow: z.string(),
  }),
  effects: z.object({
    gradient: z.string(),
    pattern: z.string().optional(),
    logoGlow: z.string().optional(),
  }),
});

const ARGS = parseArgs(process.argv.slice(2));
const THEMES_PATH = path.join(process.cwd(), "data", "themes.json");

async function main() {
  if (!ARGS.bodegaId || !ARGS.name || !ARGS.category) {
    console.error(
      "Uso: ts-node scripts/generateThemeForBodega.ts --bodegaId BOD_001 --name \"Nombre\" --category \"CATEGORIA\" [--notes \"...\"]",
    );
    process.exit(1);
  }

  const existingThemes = await readThemesFile();
  const safeArgs = {
    bodegaId: ARGS.bodegaId!,
    name: ARGS.name!,
    category: ARGS.category!,
    notes: ARGS.notes,
  };
  const generatedTheme = process.env.OPENAI_API_KEY
    ? await generateWithAI(safeArgs)
    : fallbackTheme(safeArgs);

  const parsed = themeSchema.safeParse(generatedTheme);
  if (!parsed.success) {
    console.error("El tema generado no es válido:", parsed.error.flatten());
    process.exit(1);
  }

  const newConfig: ThemeConfig = {
    bodegaId: safeArgs.bodegaId,
    name: safeArgs.name,
    theme: parsed.data,
  };

  const merged = upsertTheme(existingThemes, newConfig);
  await fs.writeFile(THEMES_PATH, JSON.stringify(merged, null, 2), "utf8");
  console.log(`Tema actualizado para ${ARGS.bodegaId} en data/themes.json`);
}

function parseArgs(argv: string[]) {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key && key.startsWith("--") && value) {
      out[key.replace("--", "")] = value;
    }
  }
  return out as {
    bodegaId?: string;
    name?: string;
    category?: string;
    notes?: string;
  };
}

async function readThemesFile(): Promise<ThemeConfig[]> {
  try {
    const content = await fs.readFile(THEMES_PATH, "utf8");
    return JSON.parse(content) as ThemeConfig[];
  } catch (err: any) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

function upsertTheme(list: ThemeConfig[], incoming: ThemeConfig) {
  const idx = list.findIndex((t) => t.bodegaId === incoming.bodegaId);
  if (idx >= 0) {
    const copy = [...list];
    copy[idx] = incoming;
    return copy;
  }
  return [...list, incoming];
}

function fallbackTheme({
  category,
  bodegaId,
  name,
}: {
  category: string;
  bodegaId: string;
  name: string;
}): ThemeTokens {
  const paletteByCategory: Record<string, { primary: string; accent: string }> =
    {
      LACTEOS: { primary: "#0ea5e9", accent: "#22d3ee" },
      BEBIDAS: { primary: "#0ea5e9", accent: "#38bdf8" },
      ASEO: { primary: "#0f172a", accent: "#22c55e" },
      HERRAMIENTAS: { primary: "#0f172a", accent: "#f97316" },
    };
  const cat = category.toUpperCase();
  const palette = paletteByCategory[cat] ?? {
    primary: "#0f172a",
    accent: "#38bdf8",
  };
  return {
    brand: {
      primary: palette.primary,
      secondary: "#1e293b",
      accent: palette.accent,
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
      gradient: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`,
      pattern: "none",
      logoGlow: "none",
    },
  };
}

async function generateWithAI({
  bodegaId,
  name,
  category,
  notes,
}: {
  bodegaId: string;
  name: string;
  category: string;
  notes?: string;
}): Promise<ThemeTokens> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = buildPrompt({ bodegaId, name, category, notes });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Eres un asistente de diseño. Responde UNICAMENTE con JSON válido que cumpla el esquema de ThemeTokens. No incluyas texto adicional.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.5,
  });

  const raw = completion.choices[0].message.content;
  if (!raw) {
    throw new Error("Respuesta vacía de OpenAI");
  }
  const parsed = JSON.parse(raw) as ThemeTokens;
  return parsed;
}

function buildPrompt({
  bodegaId,
  name,
  category,
  notes,
}: {
  bodegaId: string;
  name: string;
  category: string;
  notes?: string;
}) {
  return `
Genera un objeto JSON que cumpla el esquema ThemeTokens (brand, surface, text, ui, effects) para una bodega.
Restricciones:
- Usa colores legibles con buen contraste (evita neón).
- No incluyas URLs ni assets externos.
- Solo JSON, sin texto adicional.

Datos:
- bodegaId: ${bodegaId}
- nombre: ${name}
- categoria: ${category}
- notas: ${notes ?? "N/A"}

Ejemplo de shape:
{
  "brand": { "primary": "#0f172a", "secondary": "#1e293b", "accent": "#38bdf8" },
  "surface": { "bg": "#f8fafc", "card": "#ffffff", "border": "#e2e8f0" },
  "text": { "strong": "#0f172a", "normal": "#1f2937", "muted": "#6b7280" },
  "ui": { "buttonRadius": "0.5rem", "cardRadius": "0.75rem", "shadow": "0 10px 30px rgba(15, 23, 42, 0.08)" },
  "effects": { "gradient": "linear-gradient(135deg, #0ea5e9, #22d3ee)", "pattern": "none", "logoGlow": "none" }
}
`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
