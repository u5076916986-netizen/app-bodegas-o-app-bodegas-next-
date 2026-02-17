
type Props = {
    params: Promise<{ pedidoId: string }>
}

export default async function SeguimientoPage({ params }: Props) {
    const { pedidoId } = await params;

    return (
        <div>
            <h1>Seguimiento del pedido</h1>
            <p>ID: {pedidoId}</p>
        </div>
    );
}
