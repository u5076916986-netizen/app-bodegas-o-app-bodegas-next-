export function formatCurrency(
    value: number,
    currency: string = "COP",
    locale: string = "es-CO"
) {
    const n = Number(value ?? 0);
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(Number.isFinite(n) ? n : 0);
}
