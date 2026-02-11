import ProductosLoadClient from "@/components/ProductosLoadClient";
import Link from "next/link";

interface CargarProductosPageProps {
    params: Promise<{ bodegaId: string }>;
}

export default async function CargarProductosPage({
    params,
}: CargarProductosPageProps) {
    const { bodegaId } = await params;

    return (
        <div className="space-y-4">
            <Link
                href={`/bodega/${bodegaId}/productos`}
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
                ← Volver a Productos
            </Link>
            <ProductosLoadClient bodegaId={bodegaId} />
        </div>
    );
}
