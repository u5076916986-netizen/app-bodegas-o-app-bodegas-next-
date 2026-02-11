"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getBodegaId } from "@/lib/storage";

const STORAGE_KEY = "dev_role";
type Role = "tendero" | "bodega" | "repartidor" | "admin";

type RoleContext = {
    role: Role;
    setRole: (r: Role) => void;
};

const RoleCtx = createContext<RoleContext | undefined>(undefined);

function mapRoleToRoute(role: Role, bodegaId?: string | null) {
    const map: Record<Role, string> = {
        tendero: "/tendero",
        bodega: `/bodega/${bodegaId || "BOD_002"}/panel`,
        repartidor: "/repartidor/entregas",
        admin: "/admin/ia",
    };
    return map[role] ?? "/";
}

export function RoleProvider({ children }: { children: React.ReactNode }) {
    const [role, setRoleState] = useState<Role>("tendero");
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (typeof window === "undefined") return;
        const stored = window.localStorage.getItem(STORAGE_KEY) as Role | null;
        if (stored && ["tendero", "bodega", "repartidor", "admin"].includes(stored)) {
            setRoleState(stored);
        }
    }, []);

    useEffect(() => {
        if (!pathname) return;
        const nextRole: Role = pathname.startsWith("/bodega")
            ? "bodega"
            : pathname.startsWith("/repartidor")
                ? "repartidor"
                : pathname.startsWith("/admin")
                    ? "admin"
                    : "tendero";
        setRoleState((prev) => {
            if (prev === nextRole) return prev;
            try {
                window.localStorage.setItem(STORAGE_KEY, nextRole);
            } catch { }
            return nextRole;
        });
    }, [pathname]);

    const setRole = useCallback(
        (r: Role) => {
            try {
                window.localStorage.setItem(STORAGE_KEY, r);
            } catch { }
            setRoleState(r);
            // redirect to role dashboard
            const target = mapRoleToRoute(r, getBodegaId());
            // use replace to avoid extra history entry
            try {
                router.replace(target);
            } catch {
                // noop
            }
        },
        [router],
    );

    return <RoleCtx.Provider value={{ role, setRole }}>{children}</RoleCtx.Provider>;
}

export function useRole() {
    const ctx = useContext(RoleCtx);
    if (!ctx) throw new Error("useRole must be used inside RoleProvider");
    return ctx;
}

export default RoleProvider;
