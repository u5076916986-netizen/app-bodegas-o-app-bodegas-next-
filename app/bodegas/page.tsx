import type { Metadata } from "next";
import BodegasList from "./BodegasList";
import { getBodegas } from "@/lib/csv";
import Link from "next/link";
import {
  getBodegasThemeMap,
  DEFAULT_BODEGA_THEME,
  type BodegaTheme,
} from "@/lib/themes";
import AdSlot from "@/components/AdSlot";
import RecommendBanner from "@/components/RecommendBanner";
import ProfileBanner from "@/components/ProfileBanner";
import TenderoNotifications from "@/components/TenderoNotifications";
import StepperNav from "@/components/StepperNav";
import TenderoIaCard from "@/components/TenderoIaCard";

export const metadata: Metadata = {
  title: "Bodegas | APP Bodegas",
  description: "Listado de bodegas cargado desde CSV.",
};

export const revalidate = 60;

export default async function BodegasPage() {
  const bodegas = await getBodegas();
  const themes = await getBodegasThemeMap();
  const fallbackTheme: BodegaTheme =
    themes.DEFAULT ?? DEFAULT_BODEGA_THEME;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-4">
      <StepperNav currentStep="bodegas" />
      <div className="mb-4 flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Bodegas</h1>
        </div>
        <Link
          href="/pedidos"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Ver pedidos
        </Link>
      </div>

      <RecommendBanner />

      <TenderoNotifications />

      <TenderoIaCard />

      <ProfileBanner />

      <AdSlot placement="home" />

      <BodegasList
        bodegas={bodegas}
        themes={themes}
        fallbackTheme={fallbackTheme}
      />
    </main>
  );
}
