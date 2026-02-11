import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBodegaById, getProductosByBodega } from "@/lib/csv";
import BodegaThemeShell from "@/components/theme/BodegaThemeShell";
import { getThemeForBodega } from "@/lib/themes";
import BodegaDetailClient from "./BodegaDetailClient";

type PageProps = {
  params: Promise<{ bodegaId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { bodegaId } = await params;
  const bodega = await getBodegaById(bodegaId);

  if (!bodega) {
    return { title: "Bodega no encontrada" };
  }

  return {
    title: `${bodega.nombre} | APP Bodegas`,
    description: `Realiza tu pedido en ${bodega.nombre}.`,
  };
}

export default async function BodegaDetailPage({ params }: PageProps) {
  const { bodegaId } = await params;
  const bodega = await getBodegaById(bodegaId);

  if (!bodega) {
    notFound();
  }

  const productos = await getProductosByBodega(bodegaId);
  const theme = await getThemeForBodega(bodegaId);

  return (
    <BodegaThemeShell bodegaId={bodegaId} theme={theme}>
      <BodegaDetailClient bodega={bodega} productos={productos} theme={theme} />
    </BodegaThemeShell>
  );
}
