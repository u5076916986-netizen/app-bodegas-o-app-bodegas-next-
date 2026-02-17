
import { getPedidoById } from "@/lib/pedidos.server";

type Props = {
    params: Promise<{ pedidoId: string }>;
};

export default async function SeguimientoPage({ params }: Props) {
    const { pedidoId } = await params;

    try {
        const pedido = await getPedidoById(pedidoId);

        if (!pedido) {
            return <div>Pedido no encontrado: {pedidoId}</div>;
        }

        return (
            <div>
                <h1>Seguimiento</h1>
                <p>ID: {pedidoId}</p>
                <p>Estado: {pedido.estado}</p>
            </div>
        );
    } catch (error) {
        return <div>Error cargando pedido: {String(error)}</div>;
    }
}
