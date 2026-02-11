import { notFound } from "next/navigation";
import { getBodegaById, getProductosByBodega } from "@/lib/csv";
import { getThemeForBodega } from "@/lib/themes";
import BodegaDetailClient from "./BodegaDetailClient";

type Props = {
    params: Promise<{ bodegaId: string }>;
};

export const dynamic = "force-dynamic";

export default async function BodegaDetailPage({ params }: Props) {
    const { bodegaId } = await params;
    const bodega = await getBodegaById(bodegaId);

    if (!bodega) {
        notFound();
    }

    const productos = await getProductosByBodega(bodegaId);
    const theme = await getThemeForBodega(bodegaId);

    return <BodegaDetailClient bodega={bodega} productos={productos} theme={theme} />;
}