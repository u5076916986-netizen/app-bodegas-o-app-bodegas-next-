"use client";

import { useEffect, useMemo, useState } from "react";

type EtaCountdownProps = {
    etaMinISO: string;
    etaMaxISO: string;
};

const formatDateTime = (value: Date) =>
    value.toLocaleString("es-CO", {
        dateStyle: "medium",
        timeStyle: "short",
    });

const formatMinutes = (value: number) => {
    const minutes = Math.max(0, Math.round(value));
    return `${minutes} min`;
};

export default function EtaCountdown({ etaMinISO, etaMaxISO }: EtaCountdownProps) {
    const etaMin = useMemo(() => new Date(etaMinISO), [etaMinISO]);
    const etaMax = useMemo(() => new Date(etaMaxISO), [etaMaxISO]);
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 60000);
        return () => window.clearInterval(timer);
    }, []);

    const remainingMin = (etaMin.getTime() - now.getTime()) / 60000;
    const remainingMax = (etaMax.getTime() - now.getTime()) / 60000;
    const isArriving = remainingMin <= 5;

    return (
        <div className="mt-1 text-xs text-slate-500">
            <div>ETA: {etaMinISO === etaMaxISO ? formatDateTime(etaMin) : `${formatDateTime(etaMin)} - ${formatDateTime(etaMax)}`}</div>
            <div>
                {isArriving
                    ? "Llegando"
                    : `Faltan ${formatMinutes(remainingMin)} - ${formatMinutes(remainingMax)}`}
            </div>
        </div>
    );
}
