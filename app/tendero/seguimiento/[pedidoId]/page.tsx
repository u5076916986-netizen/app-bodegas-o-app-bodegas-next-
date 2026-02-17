type Props = {

import { notFound } from "next/navigation";
import { getPedidoById } from "@/lib/pedidos.server";
import { getBodegaById } from "@/lib/csv";
import CopyActions from "./CopyActions";
import EtaCountdown from "./EtaCountdown";
import SeguimientoRecommendations from "./SeguimientoRecommendations";
type Props = {

import { notFound } from "next/navigation";
import { getPedidoById } from "@/lib/pedidos.server";
import { getBodegaById } from "@/lib/csv";
import CopyActions from "./CopyActions";
import EtaCountdown from "./EtaCountdown";
import SeguimientoRecommendations from "./SeguimientoRecommendations";

type Props = {
    params: Promise<{ pedidoId: string }>;
};

export default async function SeguimientoPage({ params }: Props) {
    const { pedidoId } = await params;
    const pedido = await getPedidoById(pedidoId);
    if (!pedido) notFound();
    const bodega = pedido?.bodegaId ? await getBodegaById(pedido.bodegaId) : null;

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
        }).format(value);

    const formatDate = (value?: string) => {
        if (!value) return "N/D";
        return new Date(value).toISOString().slice(0, 16).replace("T", " ");
    };

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
                    : estadoRaw === "en_ruta" || estadoRaw === "en_camino"
                        ? "en_ruta"
                        : estadoRaw === "entregado"
                            ? "entregado"
                            : "confirmado";

    const estadoMeta: Record<string, { label: string; hint: string; badge: string }> = {
        confirmado: {
            label: "Confirmado",
            hint: "Tu pedido fue confirmado y ya está en preparación.",
            badge: "bg-blue-100 text-blue-800",
        },
        preparando: {
            label: "Preparando",
            hint: "La bodega está alistando los productos.",
            badge: "bg-amber-100 text-amber-800",
        },
        asignado: {
            label: "Asignado",
            hint: "Ya hay un repartidor asignado a tu pedido.",
            badge: "bg-indigo-100 text-indigo-800",
        },
        en_ruta: {
            label: "En ruta",
            hint: "El repartidor va camino a la dirección de entrega.",
            badge: "bg-emerald-100 text-emerald-800",
        },
        entregado: {
            label: "Entregado",
            hint: "El pedido fue entregado. Gracias por comprar.",
            badge: "bg-slate-900 text-white",
        },
    };
    const estadoInfo = estadoMeta[estadoNormalizado] ?? estadoMeta.confirmado;

    const destination = pedido.datosEntrega?.direccion || pedido.direccion || "";
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        destination,
    )}${bodega?.direccion ? `&origin=${encodeURIComponent(bodega.direccion)}` : ""}`;
    const mapsEmbedUrl = destination
        ? `https://www.google.com/maps?q=${encodeURIComponent(destination)}&output=embed`
        : "";
    const wazeUrl = destination
        ? `https://waze.com/ul?q=${encodeURIComponent(destination)}&navigate=yes`
        : "";
    const estimadoHoras = parseEstimadoHoras(bodega?.tiempo_entrega_estimado ?? null);
    const etaInfo = estimadoHoras && pedido.createdAt && estadoNormalizado === "en_ruta"
        ? (() => {
            const base = new Date(pedido.createdAt);
            const min = new Date(base.getTime() + estimadoHoras.min * 60 * 60 * 1000);
            const max = new Date(base.getTime() + estimadoHoras.max * 60 * 60 * 1000);
            return {
                etaMinISO: min.toISOString(),
                etaMaxISO: max.toISOString(),
            };
        })()
        : null;

    return (
        <div className="space-y-6">
            <header className="border-b border-[color:var(--surface-border)] pb-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[color:var(--text-strong)]">
                            Seguimiento del pedido
                        </h1>
                        <p className="text-sm text-[color:var(--text-muted)]">ID: {pedido.pedidoId}</p>
                        <p className="text-sm text-[color:var(--text-muted)]">
                            Fecha: {formatDate(pedido.createdAt)}
                        </p>
                        {pedido.trackingCode ? (
                            <p className="text-xs text-[color:var(--text-muted)]">
                                Tracking: {pedido.trackingCode}
                            </p>
                        ) : null}
                        <div className="mt-3">
                            <CopyActions
                                pedidoId={pedido.pedidoId}
                                trackingCode={pedido.trackingCode}
                                direccion={destination}
                            />
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${estadoInfo.badge}`}>
                            {estadoInfo.label}
                        </span>
                        <p className="mt-2 text-xs text-[color:var(--text-muted)] max-w-[220px]">
                            {estadoInfo.hint}
                        </p>
                    </div>
                </div>
            </header>

            <aside className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-[color:var(--surface-border)] bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Resumen del pedido</h2>
                    <div className="mt-4 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-[color:var(--text-muted)]">Cliente</span>
                            <span className="font-semibold text-[color:var(--text-strong)]">{pedido.cliente?.nombre}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[color:var(--text-muted)]">Teléfono</span>
                            <span className="font-semibold text-[color:var(--text-strong)]">{pedido.cliente?.telefono}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[color:var(--text-muted)]">Dirección</span>
                            <span className="font-semibold text-[color:var(--text-strong)]">{pedido.datosEntrega?.direccion || pedido.direccion}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[color:var(--text-muted)]">Estado</span>
                            <span className="font-semibold text-[color:var(--text-strong)]">{estadoInfo.label}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[color:var(--text-muted)]">Total</span>
                            <span className="font-semibold text-[color:var(--text-strong)]">{formatCurrency(pedido.total)}</span>
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-[color:var(--surface-border)] bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Ubicación de entrega</h2>
                    <div className="mt-2 text-sm text-[color:var(--text-muted)]">
                        {destination}
                    </div>
                    {mapsEmbedUrl ? (
                        <iframe
                            src={mapsEmbedUrl}
                            width="100%"
                            height="200"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    ) : null}
                    <div className="mt-2 flex gap-2">
                        {mapsUrl ? (
                            <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex rounded-full bg-sky-700 px-3 py-1 text-xs font-semibold text-white"
                            >
                                Ver en Google Maps
                            </a>
                        ) : null}
                        {wazeUrl ? (
                            <a
                                href={wazeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex rounded-full bg-indigo-700 px-3 py-1 text-xs font-semibold text-white"
                            >
                                Ver en Waze
                            </a>
                        ) : null}
                    </div>
                </div>
                {etaInfo ? (
                    <EtaCountdown etaMinISO={etaInfo.etaMinISO} etaMaxISO={etaInfo.etaMaxISO} />
                ) : null}
            </aside>

            <SeguimientoRecommendations
                bodegaId={pedido.bodegaId}
                items={pedido.items ?? []}
            />
        </div>
    );
}
