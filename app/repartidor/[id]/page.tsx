import { getPedidoById } from "@/lib/pedidos.server";
import { notFound } from "next/navigation";
import RepartidorDetalleClient from "./RepartidorDetalleClient";

type Params = {
    params: Promise<{ id: string }>;
};

export const metadata = {
    title: "Detalle Entrega | Repartidor",
};

export default async function RepartidorDetallePage({ params }: Params) {
    const { id } = await params;
    const pedidoRaw = await getPedidoById(id);
    const pedido = pedidoRaw ? { ...pedidoRaw, pedidoId: pedidoRaw.id, datosEntrega: ('datosEntrega' in pedidoRaw ? pedidoRaw.datosEntrega as { [key: string]: any; direccion?: string } | null | undefined : undefined), items: Array.isArray(pedidoRaw.items) ? pedidoRaw.items : [] } : null;

    if (!pedido) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Detalle Entrega {pedido.pedidoId}</h1>
            <RepartidorDetalleClient pedido={pedido} />
        </div>
    );
}
