import ClientCuponesImpl from "./ClientCuponesImpl";

export default async function Page({
  params,
}: {
  params: Promise<{ bodegaId: string }>;
}) {
  const { bodegaId } = await params;
  return <ClientCuponesImpl bodegaId={bodegaId} />;
}
