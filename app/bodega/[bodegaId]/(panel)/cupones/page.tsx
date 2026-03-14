import IaSugerenciasPromos from "@/components/IaSugerenciasPromos";
import { getCupones } from "@/lib/cupones.server";
import CuponesClient from "@/app/bodega/cupones/CuponesClient";
import Link from "next/link";

interface CuponesPageProps {
    params: Promise<{ bodegaId: string }>;
}

export default async function CuponesPageBodega({ params }: CuponesPageProps) {
    const { bodegaId } = await params;
    const allCupones = await getCupones();

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="text-sm text-gray-600">
                <Link href={`/bodega/${bodegaId}/panel`} className="text-blue-600 hover:underline">
                    Panel
                </Link>
                <span className="mx-2">›</span>
                <span className="font-medium">Cupones</span>
            </div>

            <IaSugerenciasPromos bodegaId={bodegaId} modo="cupon" />
            <CuponesClient initialCupones={allCupones} />
        </div>
    );
}
