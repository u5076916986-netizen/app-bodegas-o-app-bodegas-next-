import Link from "next/link";
import { notFound } from "next/navigation";
import { getPedidoById } from "@/lib/pedidos.server";
import BodegaThemeShell from "@/components/theme/BodegaThemeShell";
import TenderoNotifications from "@/components/TenderoNotifications";
import { getBodegaById } from "@/lib/csv";
import SeguimientoRecommendations from "./SeguimientoRecommendations";
import StepperNav from "@/components/StepperNav";
import CopyActions from "./CopyActions";
import EtaCountdown from "./EtaCountdown";


export default async function SeguimientoPage({
    params
}: {
    params: { pedidoId: string }
}) {
    const { pedidoId } = params;
    const pedido = await getPedidoById(pedidoId);

    if (!pedido) {
        notFound();
    }

    const formatDate = (value?: string) => {
        if (!value) return "N/D";
        return new Date(value).toISOString().slice(0, 16).replace("T", " ");
    };

    const bodega = pedido?.bodegaId ? await getBodegaById(pedido.bodegaId) : null;

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
        }).format(value);

    const parseEstimadoHoras = (estimado?: string | null) => {
        if (!estimado) return null;
        const matches = estimado.match(/(\d+)/g);
        if (!matches || matches.length === 0) return null;
        const nums = matches.map((value) => Number(value)).filter((value) => Number.isFinite(value));
        if (nums.length === 0) return null;
        if (nums.length === 1) return { min: nums[0], max: nums[0] };
        const [min, max] = nums;
        return { min, max };
    };

    const steps = ["confirmado", "preparando", "asignado", "en_ruta", "entregado"] as const;
    const estadoRaw = String(pedido.estado || "confirmado");
    const estadoNormalizado =
        estadoRaw === "nuevo" || estadoRaw === "confirmado"
            ? "confirmado"
            : estadoRaw === "en_bodega" || estadoRaw === "recogido"
                ? "preparando"
                : estadoRaw === "asignado"
                    ? "asignado"

                    export default function SeguimientoPage({ params }: { params: { pedidoId: string } }) {
        return (
            <div>
                <h1>Seguimiento del pedido</h1>
                <p>ID: {params.pedidoId}</p>
            </div>
        );
    }
    <span className="font-semibold text-slate-900">
        {pedido.datosEntrega?.telefono || pedido.cliente?.telefono || "Sin telefono"}
    </span>
                                </div >
        <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">Notas</span>
            <span className="text-right text-slate-900">
                {pedido.datosEntrega?.notas || "Sin notas"}
            </span>
        </div>
                            </div >
                        </section >
                    </div >

        <aside className="space-y-6">
            {destination && estadoNormalizado === "en_ruta" ? (
                <div className="rounded-xl border border-[color:var(--surface-border)] bg-white p-6 shadow-sm">
                    <h3 className="mb-2 font-semibold text-[color:var(--text-strong)]">Ruta a la entrega</h3>
                    <p className="mb-4 text-xs text-[color:var(--text-muted)]">
                        Abre la navegacion desde la bodega hasta el cliente.
                    </p>
                    {mapsEmbedUrl ? (
                        <div className="mb-4 overflow-hidden rounded-lg border border-slate-200">
                            <iframe
                                title="Mapa de entrega"
                                src={mapsEmbedUrl}
                                className="h-48 w-full"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                    ) : null}
                    <div className="flex flex-col gap-2">
                        <Link
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                            Abrir ruta
                        </Link>
                        {wazeUrl ? (
                            <Link
                                href={wazeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Abrir Waze
                            </Link>
                        ) : null}
                    </div>
                </div>
            ) : null}
            {destination && estadoNormalizado !== "en_ruta" ? (
                <div className="rounded-xl border border-[color:var(--surface-border)] bg-white p-6 shadow-sm">
                    <h3 className="mb-2 font-semibold text-[color:var(--text-strong)]">Ruta a la entrega</h3>
                    <p className="text-xs text-[color:var(--text-muted)]">
                        La ruta estara disponible cuando el pedido este en ruta.
                    </p>
                </div>
            ) : null}
            <div className="rounded-xl border border-[color:var(--surface-border)] bg-white p-6 shadow-sm">
                <h3 className="mb-2 font-semibold text-[color:var(--text-strong)]">Contacto de la bodega</h3>
                <div className="space-y-2 text-sm text-[color:var(--text-normal)]">
                    <p className="text-slate-700">{bodega?.nombre || "Bodega"}</p>
                    {bodega?.telefono ? (
                        <Link
                            href={`tel:${bodega.telefono}`}
                            className="text-sky-700 hover:underline"
                        >
                            {bodega.telefono}
                        </Link>
                    ) : null}
                    {bodega?.correo_pedidos ? (
                        <Link
                            href={`mailto:${bodega.correo_pedidos}`}
                            className="text-sky-700 hover:underline"
                        >
                            {bodega.correo_pedidos}
                        </Link>
                    ) : null}
                </div>
            </div>
            <SeguimientoRecommendations
                bodegaId={pedido.bodegaId || ""}
                items={pedido.items ?? []}
            />
        </aside>
                </div >
            </div >
        </BodegaThemeShell >
    );
}
