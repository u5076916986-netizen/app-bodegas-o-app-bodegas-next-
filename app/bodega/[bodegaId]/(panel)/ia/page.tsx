import IaClient from "@/components/IaClient";

interface IaPageProps {
    params: Promise<{ bodegaId: string }>;
}

export default async function IaPage({ params }: IaPageProps) {
    const { bodegaId } = await params;

    return <IaClient bodegaId={bodegaId} />;
}
