import Link from "next/link";
import RoleSidebarNav, { RoleNavItem } from "@/components/RoleSidebarNav";

export default function RoleLayout({
    roleLabel,
    title,
    subtitle,
    navItems,
    backHref,
    backLabel = "Volver",
    children,
    mobileLabel = "Navegación",
}: {
    roleLabel: string;
    title: string;
    subtitle?: string;
    navItems: RoleNavItem[];
    backHref?: string;
    backLabel?: string;
    mobileLabel?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-7xl px-4 py-6">
                <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                                {roleLabel}
                            </span>
                            <div>
                                <div className="text-lg font-semibold text-slate-900">{title}</div>
                                {subtitle ? (
                                    <div className="text-xs text-slate-500">{subtitle}</div>
                                ) : null}
                            </div>
                        </div>
                        {backHref ? (
                            <Link
                                href={backHref}
                                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                                {backLabel}
                            </Link>
                        ) : null}
                    </div>
                    <details className="lg:hidden mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800">
                            {mobileLabel}
                        </summary>
                        <div className="px-4 pb-4">
                            <RoleSidebarNav items={navItems} variant="mobile" />
                        </div>
                    </details>
                </header>

                <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
                    <aside className="hidden lg:block">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <RoleSidebarNav items={navItems} />
                        </div>
                    </aside>
                    <main className="min-w-0">{children}</main>
                </div>
            </div>
        </div>
    );
}
