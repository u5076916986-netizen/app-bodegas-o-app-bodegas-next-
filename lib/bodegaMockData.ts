// Mock data para panel de bodega
export const mockBodegaData = {
    bodegaId: "BOD_001",
    nombre: "Bodega Centro",
    ciudad: "Bogotá",
    zona: "Centro",
    minPedido: 50000,
    horariosAtencion: "08:00 - 18:00",
};

export const mockProductos = [
    { id: "PRD_001", nombre: "Arroz Blanco", sku: "ARR-001", categoria: "Granos", precio: 5000, stock: 150, stockMin: 50, activo: true, foto: null, marca: "Éxito" },
    { id: "PRD_002", nombre: "Frijoles Rojo", sku: "FRI-001", categoria: "Granos", precio: 8000, stock: 80, stockMin: 40, activo: true, foto: null, marca: "Éxito" },
    { id: "PRD_003", nombre: "Leche Entera", sku: "LEH-001", categoria: "Lácteos", precio: 3500, stock: 0, stockMin: 100, activo: true, foto: null, marca: "Alquería" },
    { id: "PRD_004", nombre: "Queso Fresco", sku: "QUE-001", categoria: "Lácteos", precio: 12000, stock: 25, stockMin: 30, activo: true, foto: null, marca: "Alquería" },
    { id: "PRD_005", nombre: "Pan Integral", sku: "PAN-001", categoria: "Panadería", precio: 2500, stock: 200, stockMin: 80, activo: false, foto: null, marca: "Bimbo" },
];

export const mockMovimientos = [
    { id: 1, fecha: "2026-02-08", tipo: "entrada", producto: "Arroz Blanco", cantidad: 100, motivo: "Compra proveedor", usuario: "Juan" },
    { id: 2, fecha: "2026-02-07", tipo: "salida", producto: "Leche Entera", cantidad: 50, motivo: "Venta pedido #123", usuario: "María" },
    { id: 3, fecha: "2026-02-07", tipo: "ajuste", producto: "Frijoles Rojo", cantidad: -10, motivo: "Merma/Vencimiento", usuario: "Carlos" },
    { id: 4, fecha: "2026-02-06", tipo: "entrada", producto: "Queso Fresco", cantidad: 30, motivo: "Compra proveedor", usuario: "Juan" },
];

export const mockPromociones = [
    { id: 1, nombre: "10% Granos", tipo: "descuento", valor: 10, producto: "Arroz Blanco", inicio: "2026-02-01", fin: "2026-02-28", activa: true },
    { id: 2, nombre: "2x1 Frijoles", tipo: "combo", valor: 0, producto: "Frijoles Rojo", inicio: "2026-02-05", fin: "2026-02-15", activa: true },
    { id: 3, nombre: "Promoción Lácteos", tipo: "descuento", valor: 15, producto: "Leche Entera", inicio: "2025-12-01", fin: "2026-01-31", activa: false },
];

export const mockPedidos = [
    { id: "PED_001", tendero: "Tendero A", estado: "nuevo", items: 5, total: 250000, fecha: "2026-02-08 10:30", zona: "Norte" },
    { id: "PED_002", tendero: "Tendero B", estado: "confirmado", items: 8, total: 380000, fecha: "2026-02-08 09:15", zona: "Centro" },
    { id: "PED_003", tendero: "Tendero C", estado: "preparando", items: 3, total: 120000, fecha: "2026-02-07 16:45", zona: "Sur" },
    { id: "PED_004", tendero: "Tendero D", estado: "listo", items: 12, total: 520000, fecha: "2026-02-07 14:20", zona: "Occidente" },
    { id: "PED_005", tendero: "Tendero E", estado: "en_camino", items: 6, total: 290000, fecha: "2026-02-07 11:00", zona: "Norte" },
    { id: "PED_006", tendero: "Tendero A", estado: "entregado", items: 4, total: 180000, fecha: "2026-02-06 15:30", zona: "Centro" },
];

export const mockTenderos = [
    { id: "TEN_001", nombre: "Tendero A", zona: "Norte", ciudad: "Bogotá", telefono: "3001234567", saldo: 150000, limite: 500000 },
    { id: "TEN_002", nombre: "Tendero B", zona: "Centro", ciudad: "Bogotá", telefono: "3002234567", saldo: 0, limite: 750000 },
    { id: "TEN_003", nombre: "Tendero C", zona: "Sur", ciudad: "Bogotá", telefono: "3003234567", saldo: -50000, limite: 300000 },
    { id: "TEN_004", nombre: "Tendero D", zona: "Occidente", ciudad: "Bogotá", telefono: "3004234567", saldo: 200000, limite: 600000 },
];

export const mockRepartidores = [
    { id: "REP_001", nombre: "Juan", zona: "Norte", estado: "activo", pedidosHoy: 5 },
    { id: "REP_002", nombre: "Carlos", zona: "Centro", estado: "activo", pedidosHoy: 8 },
    { id: "REP_003", nombre: "María", zona: "Sur", estado: "inactivo", pedidosHoy: 0 },
];

export const mockPromociones2 = [
    { id: 1, nombre: "Descuento Granos 10%", tipo: "descuento", valor: 10, estado: "activa" },
    { id: 2, nombre: "Combo Lácteos", tipo: "combo", valor: 20, estado: "activa" },
    { id: 3, nombre: "Promo Panadería", tipo: "descuento", valor: 5, estado: "inactiva" },
];

export const mockUsuarios = [
    { id: 1, nombre: "Admin Bodega", email: "admin@bodega.com", rol: "admin", estado: "activo" },
    { id: 2, nombre: "Operador Inv", email: "operador@bodega.com", rol: "operador", estado: "activo" },
    { id: 3, nombre: "Preparador", email: "prep@bodega.com", rol: "preparador", estado: "activo" },
    { id: 4, nombre: "Repartidor 1", email: "rep1@bodega.com", rol: "repartidor", estado: "inactivo" },
];

export const mockConfiguracion = {
    bodegaId: "BOD_001",
    nombre: "Bodega Centro",
    direccion: "Cra 7 #50-30",
    ciudad: "Bogotá",
    zona: "Centro",
    telefono: "6018765432",
    email: "bodega@example.com",
    minPedido: 50000,
    horarioInicio: "08:00",
    horarioFin: "18:00",
    metodoPago: ["contraentrega", "nequi", "transferencia"],
    costoEnvio: { norte: 5000, centro: 3000, sur: 5000, occidente: 4000 },
};
