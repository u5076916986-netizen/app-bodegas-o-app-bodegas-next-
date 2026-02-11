"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "dev_role";

export default function RoleGuard({ allowed = ["bodega"], fallback = "/" }: { allowed?: string[]; fallback?: string }) {
    const router = useRouter();

    useEffect(() => {
        try {
            const role = window.localStorage.getItem(STORAGE_KEY) || "tendero";
            if (!allowed.includes(role)) {
                // map role to default route
                const map: Record<string, string> = {
                    tendero: "/bodegas",
                    bodega: "/bodega",
                    repartidor: "/pedidos",
                    admin: "/admin/ia",
                };
                const dest = map[role] || fallback || "/";
                router.replace(dest);
            }
        } catch (e) {
            // ignore
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
