
import ProductosClient from "@/components/ProductosClient";
import ProductosLoadClient from "@/components/ProductosLoadClient";
import { Suspense } from "react";

interface ProductosPageProps {
    params: Promise<{ bodegaId: string }>;
}

export default async function ProductosPage({ params }: ProductosPageProps) {
    const { bodegaId } = await params;

    return (
        <div className="space-y-8 max-w-5xl mx-auto p-4">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Gestión de Productos</h1>
                <a
                    href={`/bodega/${bodegaId}/pedidos`}
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 transition"
                >
                    Ver pedidos
                    <span aria-hidden="true">📦</span>
                </a>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-lg font-semibold mb-2">Subir Excel o Fotos</h2>
                    <Suspense fallback={<div className="p-4">Cargando...</div>}>
                        <ProductosLoadClient bodegaId={bodegaId} />
                    </Suspense>
                </div>
                <div>
                    <h2 className="text-lg font-semibold mb-2">Catálogo Actual</h2>
                    <Suspense fallback={<div className="p-4">Cargando...</div>}>
                        <ProductosClient bodegaId={bodegaId} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
