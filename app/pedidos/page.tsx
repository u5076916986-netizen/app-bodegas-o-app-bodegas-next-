import { type Pedido } from "@/lib/pedidos";
import MisPedidosClient from "./MisPedidosClient";

export const revalidate = 0;

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.NEXT_PUBLIC_VERCEL_URL)
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  return "http://localhost:3000";
};

export default async function MisPedidosPage() {
  // Nota: el filtrado de teléfono se hace en el cliente con localStorage
  // porque solo el cliente tiene acceso a localStorage del navegador
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Mis pedidos
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Mis Pedidos</h1>
        <p className="text-sm text-slate-600">
          Aquí puedes ver el historial de tus pedidos y su estado.
        </p>
      </header>

      <MisPedidosClient />
    </main>
  );
}
