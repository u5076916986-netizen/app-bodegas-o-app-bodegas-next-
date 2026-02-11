import { redirect } from "next/navigation";

export default async function BodegaIdRedirectPage({
    params,
}: {
    params: Promise<{ bodegaId: string }>;
}) {
    const { bodegaId } = await params;
    redirect(`/bodega/${bodegaId}/panel`);
}
