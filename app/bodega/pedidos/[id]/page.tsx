import { getPedidoById } from "@/lib/pedidos.server";
import { notFound } from "next/navigation";
import PedidoDetalleClient from "./PedidoDetalleClient";

export const metadata = {
    title: "Detalle Pedido | Bodega",
};

type Props = {
    params: Promise<{ id: string }>;
};

export default async function PedidoDetallePage({ params }: Props) {
    const { id } = await params;
    const pedido = await getPedidoById(id);

    if (!pedido) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Detalle del Pedido</h1>

            <PedidoDetalleClient initialPedido={pedido} />
        </div>
    );
}
