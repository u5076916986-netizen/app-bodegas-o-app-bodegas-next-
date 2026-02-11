import ConfiguracionClient from '@/components/ConfiguracionClient';

export default async function ConfiguracionPage({
    params,
}: {
    params: Promise<{ bodegaId: string }>;
}) {
    const { bodegaId } = await params;
    return <ConfiguracionClient bodegaId={bodegaId} />;
}
