import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

export type LedgerEntry = {
    id: string;
    pedidoId: string;
    bodegaId?: string;
    repartidorId?: string | null;
    tenderoId?: string | null;
    totalPedido: number;
    puntosTendero: number;
    gananciaRepartidor: number;
    margenPlataforma: number;
    createdAt: string;
};

export type Movimiento = {
    id: string;
    tipo: "gana" | "redime";
    puntos: number;
    pedidoId: string;
    bodegaId?: string;
    tenderoId?: string | null;
    createdAt: string;
};

export type Cuenta = {
    accountId: string;
    tipo: "tendero" | "repartidor";
    puntos: number;
    ganancias: number;
    updatedAt: string;
};

type LedgerConfig = {
    baseEntrega: number;
    porcentaje: number;
    margenPercent: number;
};

const DATA_DIR = join(process.cwd(), "data");
const LEDGER_PATH = join(DATA_DIR, "ledger.json");
const CUENTAS_PATH = join(DATA_DIR, "cuentas.json");
const MOVIMIENTOS_PATH = join(DATA_DIR, "movimientos.json");
const CONFIG_PATH = join(DATA_DIR, "configuracion.json");

const DEFAULT_CONFIG: LedgerConfig = {
    baseEntrega: 5000,
    porcentaje: 0.02,
    margenPercent: 0.12,
};

const safeNumber = (value: unknown, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const ensureDataFile = async <T>(filePath: string, fallback: T) => {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(filePath, JSON.stringify(fallback, null, 2), "utf-8");
};

const readJsonFile = async <T>(filePath: string, fallback: T): Promise<T> => {
    try {
        const raw = await readFile(filePath, "utf-8");
        return JSON.parse(raw) as T;
    } catch (err: any) {
        if (err?.code === "ENOENT") {
            await ensureDataFile(filePath, fallback);
            return fallback;
        }
        throw err;
    }
};

const writeJsonFile = async <T>(filePath: string, data: T) => {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
};

export const getLedgerConfig = async (): Promise<LedgerConfig> => {
    try {
        const raw = await readFile(CONFIG_PATH, "utf-8");
        const config = JSON.parse(raw) as Record<string, any>;
        const baseEntrega = safeNumber(config?.entregas?.costoBaseEnvio, DEFAULT_CONFIG.baseEntrega);
        return {
            ...DEFAULT_CONFIG,
            baseEntrega,
        };
    } catch {
        return DEFAULT_CONFIG;
    }
};

const calcTotalPedido = (pedido: Record<string, any>) => {
    const total = safeNumber(pedido?.total, NaN);
    if (Number.isFinite(total)) {
        return total;
    }
    const items = Array.isArray(pedido?.items) ? pedido.items : [];
    return items.reduce((sum: number, item: any) => {
        const subtotal = safeNumber(item?.subtotal, NaN);
        if (Number.isFinite(subtotal)) {
            return sum + subtotal;
        }
        const precio = safeNumber(item?.precio ?? item?.precio_cop, 0);
        const cantidad = safeNumber(item?.cantidad, 0);
        return sum + precio * cantidad;
    }, 0);
};

const getTenderoId = (pedido: Record<string, any>) => {
    return (
        pedido?.cliente?.telefono ||
        pedido?.datosEntrega?.telefono ||
        pedido?.cliente?.nombre ||
        pedido?.datosEntrega?.nombre ||
        null
    );
};

export const readLedger = async () =>
    readJsonFile<LedgerEntry[]>(LEDGER_PATH, []);

export const readCuentas = async () =>
    readJsonFile<Cuenta[]>(CUENTAS_PATH, []);

export const readMovimientos = async () =>
    readJsonFile<Movimiento[]>(MOVIMIENTOS_PATH, []);

export const getPuntosBalance = async (tenderoId: string, bodegaId?: string | null) => {
    if (!tenderoId) return 0;
    const movimientos = await readMovimientos();
    return movimientos
        .filter((mov) => mov.tenderoId === tenderoId)
        .filter((mov) => (bodegaId ? mov.bodegaId === bodegaId : true))
        .reduce((sum, mov) => sum + mov.puntos, 0);
};

export const getLedgerEntryByPedidoId = async (pedidoId: string) => {
    if (!pedidoId) return null;
    const ledger = await readLedger();
    return ledger.find((entry) => entry.pedidoId === pedidoId) ?? null;
};

const upsertCuenta = (
    cuentas: Cuenta[],
    accountId: string,
    tipo: Cuenta["tipo"],
) => {
    const index = cuentas.findIndex(
        (cuenta) => cuenta.accountId === accountId && cuenta.tipo === tipo,
    );
    if (index !== -1) {
        return cuentas[index];
    }
    const nueva: Cuenta = {
        accountId,
        tipo,
        puntos: 0,
        ganancias: 0,
        updatedAt: new Date().toISOString(),
    };
    cuentas.push(nueva);
    return nueva;
};

const buildLedgerEntry = async (pedido: Record<string, any>) => {
    const pedidoId = String(pedido?.id || pedido?.pedidoId || "").trim();
    if (!pedidoId) return null;

    const config = await getLedgerConfig();
    const totalPedido = calcTotalPedido(pedido);
    const puntosTendero = Math.floor(totalPedido / 1000);
    const margenPlataforma = Math.round(totalPedido * config.margenPercent);
    const gananciaRepartidor = pedido?.repartidorId
        ? Math.round(config.baseEntrega + totalPedido * config.porcentaje)
        : 0;

    const id =
        typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `LED_${pedidoId}_${Date.now()}`;

    const createdAt = new Date().toISOString();

    return {
        id,
        pedidoId,
        bodegaId: pedido?.bodegaId,
        repartidorId: pedido?.repartidorId ?? null,
        tenderoId: getTenderoId(pedido),
        totalPedido,
        puntosTendero,
        gananciaRepartidor,
        margenPlataforma,
        createdAt,
    } as LedgerEntry;
};

export const applyLedgerForPedido = async (pedido: Record<string, any>) => {
    const pedidoId = String(pedido?.id || pedido?.pedidoId || "").trim();
    if (!pedidoId) {
        return { applied: false, reason: "missing_pedidoId" } as const;
    }

    const ledger = await readLedger();
    const existing = ledger.find((entry) => entry.pedidoId === pedidoId);
    if (existing) {
        return { applied: false, entry: existing, reason: "already_applied" } as const;
    }

    const entry = await buildLedgerEntry(pedido);
    if (!entry) {
        return { applied: false, reason: "invalid_entry" } as const;
    }

    ledger.push(entry);
    await writeJsonFile(LEDGER_PATH, ledger);

    const movimientos = await readMovimientos();
    movimientos.push({
        id:
            typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `MOV_${pedidoId}_${Date.now()}`,
        tipo: "gana",
        puntos: entry.puntosTendero,
        pedidoId,
        bodegaId: entry.bodegaId,
        tenderoId: entry.tenderoId ?? null,
        createdAt: entry.createdAt,
    });
    await writeJsonFile(MOVIMIENTOS_PATH, movimientos);

    const cuentas = await readCuentas();

    if (entry.tenderoId) {
        const cuentaTendero = upsertCuenta(cuentas, entry.tenderoId, "tendero");
        cuentaTendero.puntos += entry.puntosTendero;
        cuentaTendero.updatedAt = entry.createdAt;
    }

    if (entry.repartidorId) {
        const cuentaRepartidor = upsertCuenta(cuentas, entry.repartidorId, "repartidor");
        cuentaRepartidor.ganancias += entry.gananciaRepartidor;
        cuentaRepartidor.updatedAt = entry.createdAt;
    }

    await writeJsonFile(CUENTAS_PATH, cuentas);

    return { applied: true, entry } as const;
};

export const addMovimientoRedime = async (input: {
    tenderoId: string;
    puntos: number;
    pedidoId?: string;
    bodegaId?: string;
}) => {
    const { tenderoId, puntos, pedidoId, bodegaId } = input;
    if (!tenderoId || !Number.isFinite(puntos) || puntos <= 0) {
        return { ok: false, error: "Datos inválidos" } as const;
    }

    const balance = await getPuntosBalance(tenderoId, bodegaId);
    if (balance < puntos) {
        return { ok: false, error: "Puntos insuficientes" } as const;
    }

    const movimientos = await readMovimientos();
    const createdAt = new Date().toISOString();
    movimientos.push({
        id:
            typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `MOV_RED_${Date.now()}`,
        tipo: "redime",
        puntos: -Math.abs(puntos),
        pedidoId: pedidoId ?? "",
        bodegaId,
        tenderoId,
        createdAt,
    });
    await writeJsonFile(MOVIMIENTOS_PATH, movimientos);

    const cuentas = await readCuentas();
    const cuentaTendero = upsertCuenta(cuentas, tenderoId, "tendero");
    cuentaTendero.puntos = Math.max(0, cuentaTendero.puntos - puntos);
    cuentaTendero.updatedAt = createdAt;
    await writeJsonFile(CUENTAS_PATH, cuentas);

    return { ok: true } as const;
};

export const getGananciasHoy = (ledger: LedgerEntry[], repartidorId: string) => {
    const today = new Date();
    const target = today.toDateString();
    return ledger
        .filter((entry) => entry.repartidorId === repartidorId)
        .filter((entry) => new Date(entry.createdAt).toDateString() === target)
        .reduce((sum, entry) => sum + entry.gananciaRepartidor, 0);
};

export const getGananciasSemana = (ledger: LedgerEntry[], repartidorId: string) => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    return ledger
        .filter((entry) => entry.repartidorId === repartidorId)
        .filter((entry) => {
            const date = new Date(entry.createdAt);
            return date >= start && date <= end;
        })
        .reduce((sum, entry) => sum + entry.gananciaRepartidor, 0);
};
