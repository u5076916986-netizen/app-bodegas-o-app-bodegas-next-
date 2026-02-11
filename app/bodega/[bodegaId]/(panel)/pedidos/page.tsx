import PedidosBodega from "./PedidosBodega";
import Breadcrumbs from "@/app/ui/Breadcrumbs";

export default async function PedidosPage({
    params,
}: {
    params: Promise<{ bodegaId: string }>;
}) {
    const { bodegaId } = await params;
    return (
        <div className="space-y-4">
            <Breadcrumbs
                items={[
                    { label: "Panel", href: `/bodega/${bodegaId}/panel` },
                    { label: "Pedidos" },
                ]}
            />
            <PedidosBodega bodegaId={bodegaId} />
        </div>
    );
}
