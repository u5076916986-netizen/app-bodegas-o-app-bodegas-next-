import { notFound } from "next/navigation";
import QrView from "../QrView";
import { getPedidoById } from "@/lib/pedidos.server";

type PageProps = {
  params: Promise<{ pedidoId: string }>;
};

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  return "http://localhost:3000";
};

export default async function PedidoQrPage({ params }: PageProps) {
  const { pedidoId } = await params;
  const pedido = await getPedidoById(pedidoId);
  if (!pedido) {
    notFound();
  }

  const url = `${getBaseUrl()}/pedidos/${pedidoId}`;

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <QrView pedidoId={pedidoId} url={url} />
    </main>
  );
}
