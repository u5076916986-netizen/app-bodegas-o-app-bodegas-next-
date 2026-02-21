import { getPedidoById } from "@/lib/pedidos.server";
import { notFound } from "next/navigation";
import PedidoDetalleClient from "./PedidoDetalleClient";

export const metadata = {
    title: "Detalle Pedido | Bodega",
};

type Props = {
    params: Promise<{ pedidoId: string }>;
};

export default async function PedidoDetallePage({ params }: Props) {
    const { pedidoId } = await params;
    const pedido = await getPedidoById(pedidoId);

    if (!pedido) {
        notFound();
    }

    // Asegura que los campos opcionales existen y usa optional chaining
    const initialPedido = {
        ...pedido,
        items: Array.isArray(pedido.items) ? pedido.items : [],
        pedidoId: pedido.id,
        repartidorNombre: 'repartidorNombre' in pedido ? pedido.repartidorNombre as string | undefined : undefined,
        repartidorTelefono: 'repartidorTelefono' in pedido ? pedido.repartidorTelefono as string | undefined : undefined,
        totalOriginal: 'totalOriginal' in pedido ? (pedido.totalOriginal as number | undefined) ?? undefined : undefined,
        coupon: undefined,
        trackingCode: 'trackingCode' in pedido ? (pedido.trackingCode as string | undefined) ?? undefined : undefined,
        datosEntrega: 'datosEntrega' in pedido ? (pedido.datosEntrega as any) ?? undefined : undefined,
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Detalle del Pedido</h1>

            <PedidoDetalleClient initialPedido={initialPedido} />
        </div>
    );
}
