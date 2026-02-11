import type { ThemeTokens } from "./themeTypes";

export function themeToCssVars(theme: ThemeTokens): Record<string, string> {
  return {
    "--brand-primary": theme.brand.primary,
    "--brand-secondary": theme.brand.secondary,
    "--brand-accent": theme.brand.accent,
    "--surface-bg": theme.surface.bg,
    "--surface-card": theme.surface.card,
    "--surface-border": theme.surface.border,
    "--text-strong": theme.text.strong,
    "--text-normal": theme.text.normal,
    "--text-muted": theme.text.muted,
    "--ui-button-radius": theme.ui.buttonRadius,
    "--ui-card-radius": theme.ui.cardRadius,
    "--ui-shadow": theme.ui.shadow,
    "--gradient": theme.effects.gradient,
    "--pattern": theme.effects.pattern ?? "none",
    "--logo-glow": theme.effects.logoGlow ?? "none",
  };
}
