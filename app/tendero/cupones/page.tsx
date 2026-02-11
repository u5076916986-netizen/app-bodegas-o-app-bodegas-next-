import type { Metadata } from "next";
import MisCuponesClient from "./MisCuponesClient";
import { getCupones } from "@/lib/cupones.server";

export const metadata: Metadata = {
  title: "Mis cupones | APP Bodegas",
  description:
    "Activa un cupón para autocompletarlo en la confirmación de pedidos.",
};

export default async function MisCuponesPage() {
  const cupones = await getCupones();
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Tendero</p>
        <h1 className="text-2xl font-semibold text-slate-900">Mis cupones</h1>
        <p className="text-sm text-slate-600">
          Escoge un cupón activo y confírmalo en el pedido.
        </p>
      </section>
      <MisCuponesClient cupones={cupones} />
    </main>
  );
}
