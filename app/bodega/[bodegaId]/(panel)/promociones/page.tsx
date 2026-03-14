import PromocionesClient from "@/components/PromocionesClient";
import IaSugerenciasPromos from "@/components/IaSugerenciasPromos";

interface PromocionesPageProps {
    params: Promise<{ bodegaId: string }>;
}

export default async function PromocionesPage({
    params,
}: PromocionesPageProps) {
    const { bodegaId } = await params;

    return (
        <div className="space-y-6">
            <IaSugerenciasPromos bodegaId={bodegaId} modo="promocion" />
            <PromocionesClient bodegaId={bodegaId} />
        </div>
    );
}
