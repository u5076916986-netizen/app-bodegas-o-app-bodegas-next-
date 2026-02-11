import ProductosClient from "@/components/ProductosClient";

interface ProductosPageProps {
    params: Promise<{ bodegaId: string }>;
}

export default async function ProductosPage({ params }: ProductosPageProps) {
    const { bodegaId } = await params;

    return <ProductosClient bodegaId={bodegaId} />;
}
