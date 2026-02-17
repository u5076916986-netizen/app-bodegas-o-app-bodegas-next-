

type Props = {
    params: Promise<{ pedidoId: string }>;
};

export default async function SeguimientoPage({ params }: Props) {
    const { pedidoId } = await params;
    try {
        const pedido = await getPedidoById(pedidoId);
        console.log("PEDIDO ENCONTRADO:", pedido);
        if (!pedido) {
            console.log("PEDIDO NULL para ID:", pedidoId);
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
        console.log("ERROR:", error);
        return <div>Error: {String(error)}</div>;
    }
}
