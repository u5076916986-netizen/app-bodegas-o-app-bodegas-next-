
export default function SeguimientoPage({ params }: { params: { pedidoId: string } }) {
    return (
        <div>
            <h1>Seguimiento del pedido</h1>
            <p>ID: {params.pedidoId}</p>
        </div>
    );
}
