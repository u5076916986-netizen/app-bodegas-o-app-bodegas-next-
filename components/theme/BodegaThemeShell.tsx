/* eslint-disable @next/next/no-css-tags */
import { ReactNode } from "react";
import { getThemeForBodega, type BodegaTheme, DEFAULT_BODEGA_THEME } from "@/lib/themes";

type Props = {
  bodegaId?: string;
  theme?: Partial<BodegaTheme>;
  children: ReactNode;
};

export default async function BodegaThemeShell({
  bodegaId,
  theme: propTheme,
  children,
}: Props) {
  let theme = DEFAULT_BODEGA_THEME;

  if (propTheme) {
    theme = { ...theme, ...propTheme };
  } else if (bodegaId) {
    const fetched = await getThemeForBodega(bodegaId);
    if (fetched) theme = fetched;
  }

  const themeClass = `bodega-theme-${bodegaId || "default"}`;
  const themeCss = `
    .${themeClass} {
      border-top: 2px solid ${theme.primary};
      --brand-primary: ${theme.primary};
      --brand-primary-soft: ${theme.primarySoft};
      --brand-accent: ${theme.accent};
      --brand-border: ${theme.border};
      --badge-bg: ${theme.badgeBg};
      --badge-text: ${theme.badgeText};
      --text-strong: #0f172a;
      --text-normal: #334155;
      --text-muted: #64748b;
      --surface-card: #ffffff;
      --surface-border: ${theme.border};
    }
  `;

  return (
    <div className={`min-h-screen bg-slate-50 transition-colors ${themeClass}`}>
      <style>{themeCss}</style>
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">{children}</div>
    </div>
  );
}
