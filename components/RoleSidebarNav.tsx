"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type RoleNavItem = {
    label: string;
    href: string;
    icon?: string;
};

type Variant = "sidebar" | "mobile";

export default function RoleSidebarNav({
    items,
    variant = "sidebar",
}: {
    items: RoleNavItem[];
    variant?: Variant;
}) {
    const pathname = usePathname();

    const isActive = (href: string) =>
        pathname === href || pathname.startsWith(`${href}/`);

    const baseClass =
        variant === "sidebar"
            ? "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition"
            : "whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition";

    const activeClass =
        variant === "sidebar"
            ? "bg-slate-900 text-white"
            : "bg-slate-900 text-white border-slate-900";

    const inactiveClass =
        variant === "sidebar"
            ? "text-slate-700 hover:bg-slate-100"
            : "text-slate-700 hover:bg-slate-50";

    return (
        <div className={variant === "sidebar" ? "space-y-1" : "flex flex-wrap gap-2"}>
            {items.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={`${baseClass} ${isActive(item.href) ? activeClass : inactiveClass}`}
                >
                    {item.icon ? <span className="text-base">{item.icon}</span> : null}
                    {item.label}
                </Link>
            ))}
        </div>
    );
}
