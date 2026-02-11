import RoleLayout from "@/components/RoleLayout";

export default function RepartidorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const navItems = [
        { label: "Home", href: "/repartidor", icon: "🚚" },
        { label: "Entregas", href: "/repartidor/entregas", icon: "📦" },
        { label: "Ganancias", href: "/repartidor/ganancias", icon: "💰" },
    ];

    return (
        <RoleLayout
            roleLabel="Repartidor"
            title="Panel de entregas"
            subtitle="Rutas, historial y ganancias"
            navItems={navItems}
            backHref="/inicio"
            backLabel="Cambiar modo"
            mobileLabel="Navegación repartidor"
        >
            {children}
        </RoleLayout>
    );
}
