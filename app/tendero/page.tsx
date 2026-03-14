import type { Metadata } from "next";
import { getBodegas } from "@/lib/csv";
import {
  getBodegasThemeMap,
  DEFAULT_BODEGA_THEME,
  type BodegaTheme,
} from "@/lib/themes";
import TenderoNotifications from "@/components/TenderoNotifications";
import TenderoDashboard from "@/components/TenderoDashboard";

export const metadata: Metadata = {
  title: "Inicio | APP Bodegas",
  description: "Compra en bodegas de tu zona - rápido y fácil.",
};

export const revalidate = 60;

export default async function TenderoPage() {
  const bodegas = await getBodegas();
  const themes = await getBodegasThemeMap();
  const fallbackTheme: BodegaTheme = themes.DEFAULT ?? DEFAULT_BODEGA_THEME;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-4">
      <TenderoNotifications />
      <TenderoDashboard
        bodegas={bodegas}
        themes={themes}
        fallbackTheme={fallbackTheme}
      />
    </main>
  );
}
