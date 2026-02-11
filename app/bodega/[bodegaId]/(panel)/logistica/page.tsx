import LogisticaClient from '@/components/LogisticaClient';

export default async function LogisticaPage({
    params,
}: {
    params: Promise<{ bodegaId: string }>;
}) {
    const { bodegaId } = await params;
    return <LogisticaClient bodegaId={bodegaId} />;
}
