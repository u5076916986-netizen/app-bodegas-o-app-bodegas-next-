"use client";

import { useEffect, useState } from "react";

export default function TrackingQR({ trackingCode }: { trackingCode: string }) {
    const [origin, setOrigin] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            setOrigin(window.location.origin);
        }
    }, []);

    if (!origin) return null;

    const trackUrl = `${origin}/track/${trackingCode}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(trackUrl)}`;

    return (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <img src={qrApiUrl} alt={`QR ${trackingCode}`} width={120} height={120} className="mix-blend-multiply" />
            <span className="text-[10px] uppercase tracking-wide text-slate-500">Escanear para trackear</span>
        </div>
    );
}