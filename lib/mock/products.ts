export interface Product {
    id: string;
    nombre: string;
    sku: string;
    categoria: string;
    precio: number;
    stock: number;
    activo: boolean;
    descripcion?: string;
    fotoUrl?: string;
}

export const mockProducts: Product[] = [
    {
        id: "prod_001",
        nombre: "Arroz Diana 500g",
        sku: "ARR-DIA-500",
        categoria: "Granos",
        precio: 2500,
        stock: 120,
        activo: true,
        descripcion: "Arroz blanco premium",
    },
    {
        id: "prod_002",
        nombre: "Aceite Gourmet 1L",
        sku: "ACE-GOU-1L",
        categoria: "Aceites",
        precio: 9800,
        stock: 45,
        activo: true,
        descripcion: "Aceite vegetal",
    },
    {
        id: "prod_003",
        nombre: "Gaseosa Colombiana 2L",
        sku: "GAS-COL-2L",
        categoria: "Bebidas",
        precio: 7200,
        stock: 0,
        activo: false,
        descripcion: "Bebida gaseosa sabor kola",
    },
    {
        id: "prod_004",
        nombre: "Café Sello Rojo 250g",
        sku: "CAF-SRO-250",
        categoria: "Café",
        precio: 6900,
        stock: 22,
        activo: true,
    },
    {
        id: "prod_005",
        nombre: "Atún Van Camps 170g",
        sku: "ATU-VAN-170",
        categoria: "Enlatados",
        precio: 5400,
        stock: 64,
        activo: true,
    },
];