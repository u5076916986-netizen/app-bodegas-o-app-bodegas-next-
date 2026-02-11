"use client";

import IaClient from "@/components/IaClient";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getBodegaId } from "@/lib/storage";

export default function TenderoIaPage() {
    const [bodegaId, setBodegaId] = useState<string | null>(null);

    useEffect(() => {
        setBodegaId(getBodegaId());
    }, []);

    if (!bodegaId) {
        return (
            <main className="mx-auto max-w-3xl space-y-4 p-6">
                <h1 className="text-2xl font-semibold text-slate-900">Centro IA</h1>
                <p className="text-sm text-slate-600">
                    Para usar el Centro IA necesitas seleccionar una bodega primero.
                </p>
                <Link
                    href="/tendero"
                    className="inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                    Ir a bodegas
                </Link>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-4xl p-6">
            <IaClient bodegaId={bodegaId} />
        </main>
    );
}
