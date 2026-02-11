"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // Check if user is in admin mode
        const modo = localStorage.getItem("modo");

        if (modo !== "admin") {
            // Redirect to home if not admin
            router.push("/");
            return;
        }

        setIsAuthorized(true);
    }, [router]);

    // Show loading or nothing while checking authorization
    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mb-4"></div>
                    <p className="text-slate-600">Verificando acceso...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
