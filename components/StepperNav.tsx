"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/app/providers";

export type StepKey = "bodegas" | "carrito" | "confirmar" | "seguimiento";

type StepperNavProps = {
    currentStep: StepKey;
    pedidoId?: string;
};

type StepDef = {
    key: StepKey;
    label: string;
    href: string | null;
};

const fallbackMap: Record<StepKey, { label: string; href: string }> = {
    bodegas: { label: "Inicio", href: "/inicio" },
    carrito: { label: "Bodegas", href: "/tendero" },
    confirmar: { label: "Carrito", href: "/carrito" },
    seguimiento: { label: "Confirmar", href: "/tendero/checkout" },
};

export default function StepperNav({ currentStep, pedidoId }: StepperNavProps) {
    const router = useRouter();
    const { count } = useCart();
    const [canGoBack, setCanGoBack] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        setCanGoBack(window.history.length > 1);
    }, []);

    const steps: StepDef[] = useMemo(() => {
        return [
            { key: "bodegas", label: "Bodegas", href: "/tendero" },
            { key: "carrito", label: "Carrito", href: "/carrito" },
            { key: "confirmar", label: "Confirmar", href: "/tendero/checkout" },
            {
                key: "seguimiento",
                label: "Seguimiento",
                href: pedidoId ? `/tendero/seguimiento/${encodeURIComponent(pedidoId)}` : null,
            },
        ];
    }, [pedidoId]);

    const currentIndex = steps.findIndex((step) => step.key === currentStep);
    const previousStep = currentIndex > 0 ? steps[currentIndex - 1] : null;

    const canNavigateTo = (step: StepDef) => {
        if (!step.href) return false;
        const stepIndex = steps.findIndex((item) => item.key === step.key);
        if (stepIndex <= currentIndex) return true;
        if (step.key === "confirmar") return count > 0;
        if (step.key === "seguimiento") return Boolean(pedidoId);
        return true;
    };

    const handleBack = () => {
        if (canGoBack) {
            router.back();
            return;
        }
        const fallback = fallbackMap[currentStep];
        router.push(fallback.href);
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-600">
                    Estás en: <span className="font-semibold text-slate-900">{steps[currentIndex]?.label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        ← Volver
                    </button>
                    {previousStep?.href ? (
                        <Link
                            href={previousStep.href}
                            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                        >
                            Volver al paso anterior
                        </Link>
                    ) : null}
                </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                {steps.map((step, index) => {
                    const isActive = index === currentIndex;
                    const isDone = index < currentIndex;
                    const disabled = !canNavigateTo(step);
                    return (
                        <button
                            key={step.key}
                            type="button"
                            onClick={() => {
                                if (!step.href || disabled) return;
                                router.push(step.href);
                            }}
                            disabled={disabled}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${isActive
                                    ? "bg-emerald-600 text-white"
                                    : isDone
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-slate-100 text-slate-500"
                                } ${disabled ? "cursor-not-allowed opacity-60" : "hover:opacity-90"}`}
                        >
                            {step.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
