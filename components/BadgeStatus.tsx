"use client";

interface BadgeStatusProps {
    status: string;
    label?: string;
}

export default function BadgeStatus({ status, label }: BadgeStatusProps) {
    const config: Record<string, { bg: string; text: string; label: string }> = {
        nuevo: { bg: "bg-blue-100", text: "text-blue-800", label: "Nuevo" },
        confirmado: { bg: "bg-purple-100", text: "text-purple-800", label: "Confirmado" },
        preparando: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Preparando" },
        listo: { bg: "bg-green-100", text: "text-green-800", label: "Listo" },
        en_camino: { bg: "bg-orange-100", text: "text-orange-800", label: "En camino" },
        entregado: { bg: "bg-green-100", text: "text-green-800", label: "Entregado" },
        cancelado: { bg: "bg-red-100", text: "text-red-800", label: "Cancelado" },
        activo: { bg: "bg-green-100", text: "text-green-800", label: "Activo" },
        inactivo: { bg: "bg-gray-100", text: "text-gray-800", label: "Inactivo" },
        activa: { bg: "bg-green-100", text: "text-green-800", label: "Activa" },
        inactiva: { bg: "bg-gray-100", text: "text-gray-800", label: "Inactiva" },
    };

    const { bg, text, label: defaultLabel } = config[status] || config.nuevo;

    return (
        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
            {label || defaultLabel}
        </span>
    );
}
