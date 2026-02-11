import ClientesClient from '@/components/ClientesClient';

export default async function ClientesPage({
    params,
}: {
    params: Promise<{ bodegaId: string }>;
}) {
    const { bodegaId } = await params;
    return <ClientesClient bodegaId={bodegaId} />;
}
