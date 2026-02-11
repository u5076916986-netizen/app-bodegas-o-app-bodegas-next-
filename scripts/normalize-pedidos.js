const fs = require("fs");
const path = require("path");

const dataPath = path.join(process.cwd(), "data", "pedidos.json");

const normalizeEstado = (estado) => {
    const normalized = (estado || "").toString().toLowerCase();
    const map = {
        recibido: "nuevo",
        recibida: "nuevo",
        confirmado: "confirmado",
        aceptado: "confirmado",
        preparando: "confirmado",
        listo: "confirmado",
        listo_para_envio: "confirmado",
        despachado: "en_ruta",
        en_camino: "en_ruta",
        en_ruta: "en_ruta",
        entregado: "entregado",
        entregada: "entregado",
        cancelado: "cancelado",
    };
    return map[normalized] || (normalized ? normalized : "nuevo");
};

const buildPedidoId = (bodegaId) => {
    const cleaned = (bodegaId || "BOD").trim() || "BOD";
    const suffix = Date.now().toString().slice(-6);
    return `PED_${cleaned}_${suffix}`;
};

const safeNumber = (value, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
};

const raw = fs.readFileSync(dataPath, "utf-8");
const pedidos = JSON.parse(raw);

const normalized = pedidos.map((pedido) => {
    const bodegaId = (pedido.bodegaId || "").toString().trim();
    const id = pedido.id || pedido.pedidoId || buildPedidoId(bodegaId || "BOD");
    const pedidoId = pedido.pedidoId || id;

    const cliente = pedido.cliente || {};
    const datosEntrega = pedido.datosEntrega || {};
    const nombre = datosEntrega.nombre || cliente.nombre || "";
    const telefono = datosEntrega.telefono || cliente.telefono || "";
    const direccion = datosEntrega.direccion || pedido.direccion || "";

    const items = Array.isArray(pedido.items) ? pedido.items : [];
    const normalizedItems = items.map((item) => {
        const cantidad = safeNumber(item.cantidad, 0);
        let precio = safeNumber(item.precio ?? item.precio_cop, 0);
        if (!precio && item.subtotal && cantidad > 0) {
            precio = safeNumber(item.subtotal, 0) / cantidad;
        }
        return {
            ...item,
            cantidad,
            precio,
            precio_cop: item.precio_cop ?? precio,
            subtotal: safeNumber(item.subtotal, cantidad * precio),
        };
    });

    const total = normalizedItems.reduce((sum, item) => sum + safeNumber(item.subtotal, 0), 0);
    const createdAt = pedido.createdAt || new Date().toISOString();
    const updatedAt = pedido.updatedAt || createdAt;

    return {
        ...pedido,
        id,
        pedidoId,
        bodegaId: bodegaId || pedido.bodegaId,
        estado: normalizeEstado(pedido.estado),
        cliente: pedido.cliente || (nombre || telefono ? { nombre, telefono } : undefined),
        direccion: pedido.direccion || direccion,
        datosEntrega: {
            nombre,
            telefono,
            direccion,
            notas: datosEntrega.notas ?? null,
        },
        items: normalizedItems,
        total,
        totalOriginal: pedido.totalOriginal ?? total,
        discount: pedido.discount ?? 0,
        repartidorId: pedido.repartidorId ?? null,
        repartidorNombre: pedido.repartidorNombre ?? null,
        createdAt,
        updatedAt,
    };
});

fs.writeFileSync(dataPath, JSON.stringify(normalized, null, 2), "utf-8");
console.log(`Normalizados ${normalized.length} pedidos`);
