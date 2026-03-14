import RoleLayout from "@/components/RoleLayout";
import TenderoIaChat from "@/components/TenderoIaChat";

export default function TenderoLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const navItems = [
        { label: "Inicio", href: "/tendero", icon: "🏠" },
        { label: "Carrito", href: "/tendero/checkout", icon: "🧺" },
        { label: "Mis pedidos", href: "/pedidos", icon: "📦" },
        { label: "Puntos", href: "/tendero/perfil#puntos", icon: "⭐" },
    ];

    return (
        <RoleLayout
            roleLabel="Tendero"
            title="Panel de compras"
            subtitle="Pedidos, puntos y bodegas"
            navItems={navItems}
            backHref="/inicio"
            backLabel="Cambiar modo"
            mobileLabel="Navegación tendero"
        >
            {children}
            <TenderoIaChat />
        </RoleLayout>
    );
}
