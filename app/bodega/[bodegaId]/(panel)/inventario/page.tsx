import InventarioClient from '@/components/InventarioClient';

export default async function InventarioPage({
    params,
}: {
    params: Promise<{ bodegaId: string }>;
}) {
    const { bodegaId } = await params;
    return <InventarioClient bodegaId={bodegaId} />;
}
