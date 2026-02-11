import RoleLayout from "@/components/RoleLayout";

export default async function BodegaPanelLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ bodegaId: string }>;
}) {
    const { bodegaId } = await params;

    const navItems = [
        { label: "Panel", href: `/bodega/${bodegaId}/panel`, icon: "📊" },
        { label: "Productos", href: `/bodega/${bodegaId}/productos`, icon: "📦" },
        { label: "Cargar productos", href: `/bodega/${bodegaId}/cargar-productos`, icon: "📥" },
        { label: "Pedidos", href: `/bodega/${bodegaId}/pedidos`, icon: "🧺" },
        { label: "Clientes", href: `/bodega/${bodegaId}/clientes`, icon: "👥" },
        { label: "Promociones", href: `/bodega/${bodegaId}/promociones`, icon: "🎯" },
        { label: "Configuración", href: `/bodega/${bodegaId}/configuracion`, icon: "⚙️" },
    ];

    return (
        <RoleLayout
            roleLabel="Bodega"
            title="Panel de gestión"
            subtitle={`ID ${bodegaId}`}
            navItems={navItems}
            backHref="/bodegas"
            backLabel="Volver a bodegas"
            mobileLabel="Navegación del panel"
        >
            {children}
        </RoleLayout>
    );
}
