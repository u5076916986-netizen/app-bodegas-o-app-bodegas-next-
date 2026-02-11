import PromocionesClient from "@/components/PromocionesClient";

interface PromocionesPageProps {
    params: Promise<{ bodegaId: string }>;
}

export default async function PromocionesPage({
    params,
}: PromocionesPageProps) {
    const { bodegaId } = await params;

    return <PromocionesClient bodegaId={bodegaId} />;
}
