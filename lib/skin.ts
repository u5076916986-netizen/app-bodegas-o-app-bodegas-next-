import type { BodegaTheme } from "@/lib/themes";

export type SkinTokens = {
  accentBg: string;
  accentText: string;
  accentBorder: string;
  accentRing: string;
};

const withAlpha = (color: string, alpha: number) => {
  if (!/^#([0-9a-f]{6})$/i.test(color) || alpha < 0 || alpha > 1) {
    return color;
  }
  const channel = Math.round(alpha * 255).toString(16).padStart(2, "0");
  return `${color}${channel}`;
};

const DEFAULT_TOKENS: SkinTokens = {
  accentBg: "rgba(37, 99, 235, 0.12)",
  accentText: "#1d4ed8",
  accentBorder: "#93c5fd",
  accentRing: "#bfdbfe",
};

export function getSkinTokens(theme: BodegaTheme): SkinTokens {
  const accent = theme?.brand?.accent ?? theme?.accent ?? "#1d4ed8";
  return {
    accentBg: withAlpha(accent, 0.12),
    accentText: accent,
    accentBorder: accent,
    accentRing: withAlpha(accent, 0.25),
  };
}
