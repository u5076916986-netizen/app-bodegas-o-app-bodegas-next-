import ProductosClient from "@/components/ProductosClient";
import { Suspense } from "react";

interface ProductosPageProps {
    params: Promise<{ bodegaId: string }>;
}

export default async function ProductosPage({ params }: ProductosPageProps) {
    const { bodegaId } = await params;

    return (
        <Suspense fallback={<div className="p-4">Cargando...</div>}>
            <ProductosClient bodegaId={bodegaId} />
        </Suspense>
    );
}
