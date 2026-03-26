import PedidosBodega from './PedidosBodega';

type Params = { bodegaId: string };

export default async function PedidosPage({ params }: { params: Promise<Params> }) {
    const { bodegaId } = await params;
    return <PedidosBodega bodegaId={bodegaId} />;
}
