import { notFound, redirect } from "next/navigation";
import { getBodegaById, getProductosByBodega } from "@/lib/csv";
import { getCupones } from "@/lib/cupones.server";
import ConfirmClient from "./ConfirmClient";
import Breadcrumbs from "@/app/ui/Breadcrumbs";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ConfirmPage({ searchParams }: Props) {
  const resolved = await searchParams;
  const bodegaId = typeof resolved.bodegaId === "string" ? resolved.bodegaId : undefined;

  if (!bodegaId) {
    redirect("/bodegas");
  }

  const bodega = await getBodegaById(bodegaId);
  if (!bodega) {
    notFound();
  }

  const productos = await getProductosByBodega(bodegaId);
  const cupones = await getCupones();

  return (
    <main className="mx-auto max-w-3xl p-4 md:p-6">
      <div className="mb-4">
        <Breadcrumbs
          items={[
            { label: "Inicio", href: "/tendero" },
            { label: "Confirmar pedido" },
          ]}
        />
      </div>
      <ConfirmClient
        bodegaId={bodegaId}
        bodega={bodega}
        productos={productos}
        cupones={cupones}
      />
    </main>
  );
}