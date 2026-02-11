import UsuariosClient from '@/components/UsuariosClient';

export default async function UsuariosPage({
    params,
}: {
    params: Promise<{ bodegaId: string }>;
}) {
    const { bodegaId } = await params;
    return <UsuariosClient bodegaId={bodegaId} />;
}
