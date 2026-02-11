import Papa from "papaparse";

export type ParsedProducto = {
    nombre: string;
    sku: string;
    categoria: string;
    precio: number;
    stock: number;
    descripcion: string;
};

export type InvalidDetail = {
    rowIndex: number;
    errors: string[];
    rawRow: Record<string, any>;
};

export type ImportResult = {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    validProducts: ParsedProducto[];
    invalidDetails: InvalidDetail[];
    headers: string[];
    rows: Record<string, any>[];
    mapping: HeaderMapping;
    mappingComplete: boolean;
};

export type HeaderMapping = {
    nombre?: string;
    sku?: string;
    categoria?: string;
    precio?: string;
    stock?: string;
    descripcion?: string;
};

const normalizeHeader = (value: string) =>
    value
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

const KNOWN_HEADERS: Record<string, keyof HeaderMapping> = {
    nombre: "nombre",
    producto: "nombre",
    producto_nombre: "nombre",
    nombre_producto: "nombre",
    item: "nombre",
    sku: "sku",
    codigo: "sku",
    codigo_producto: "sku",
    referencia: "sku",
    categoria: "categoria",
    categoria_producto: "categoria",
    category: "categoria",
    tipo: "categoria",
    precio: "precio",
    precio_cop: "precio",
    valor: "precio",
    costo: "precio",
    stock: "stock",
    existencias: "stock",
    cantidad: "stock",
    unidades: "stock",
    descripcion: "descripcion",
    descripcion_producto: "descripcion",
    desc: "descripcion",
};

const toNumber = (value: unknown) => {
    if (typeof value === "number") return value;
    if (typeof value !== "string") return NaN;
    const cleaned = value.replace(/[^0-9.,-]/g, "").replace(/\./g, "").replace(/,/g, ".");
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : NaN;
};

const normalizeRow = (row: Record<string, any>) => {
    const normalized: Record<string, any> = {};
    Object.keys(row).forEach((key) => {
        normalized[normalizeHeader(key)] = row[key];
    });
    return normalized;
};

const autoMapHeaders = (headers: string[], rows: Record<string, any>[]): HeaderMapping => {
    const mapping: HeaderMapping = {};
    headers.forEach((header) => {
        const normalized = normalizeHeader(header);
        const canonical = KNOWN_HEADERS[normalized];
        if (canonical && !mapping[canonical]) {
            mapping[canonical] = normalized;
        }
    });

    const sampleRows = rows.slice(0, 20);
    const stats = headers.map((header) => {
        const values = sampleRows.map((row) => row[header]).filter((v) => v !== undefined && v !== null);
        const stringValues = values.map((v) => String(v).trim()).filter(Boolean);
        const numericValues = stringValues
            .map((v) => toNumber(v))
            .filter((v) => Number.isFinite(v)) as number[];
        const numericRatio = stringValues.length ? numericValues.length / stringValues.length : 0;
        const average = numericValues.length
            ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length
            : 0;
        const max = numericValues.length ? Math.max(...numericValues) : 0;
        const hasSpacesRatio = stringValues.length
            ? stringValues.filter((v) => v.includes(" ")).length / stringValues.length
            : 0;
        const hasDigitsRatio = stringValues.length
            ? stringValues.filter((v) => /\d/.test(v)).length / stringValues.length
            : 0;
        const avgLen = stringValues.length
            ? stringValues.reduce((sum, v) => sum + v.length, 0) / stringValues.length
            : 0;
        return {
            header,
            numericRatio,
            average,
            max,
            hasSpacesRatio,
            hasDigitsRatio,
            avgLen,
        };
    });

    const pickBest = (filter: (s: typeof stats[number]) => boolean, score: (s: typeof stats[number]) => number) => {
        const candidates = stats.filter(filter).sort((a, b) => score(b) - score(a));
        return candidates[0]?.header;
    };

    if (!mapping.precio) {
        const best = pickBest(
            (s) => s.numericRatio >= 0.7 && s.average >= 100,
            (s) => s.average + s.max / 10,
        );
        if (best) mapping.precio = best;
    }

    if (!mapping.stock) {
        const best = pickBest(
            (s) => s.numericRatio >= 0.7 && s.average >= 0 && s.average <= 10000,
            (s) => s.numericRatio * 100 - s.average / 100,
        );
        if (best) mapping.stock = best;
    }

    if (!mapping.sku) {
        const best = pickBest(
            (s) => s.numericRatio < 0.6 && s.hasSpacesRatio < 0.2 && s.avgLen <= 24,
            (s) => (1 - s.hasSpacesRatio) * 100 + s.hasDigitsRatio * 10,
        );
        if (best) mapping.sku = best;
    }

    if (!mapping.nombre) {
        const best = pickBest(
            (s) => s.numericRatio < 0.2 && s.hasSpacesRatio >= 0.3,
            (s) => s.avgLen + s.hasSpacesRatio * 10,
        );
        if (best) mapping.nombre = best;
    }

    if (!mapping.categoria) {
        const best = pickBest(
            (s) => s.numericRatio < 0.2 && s.avgLen <= 20,
            (s) => (1 - s.hasSpacesRatio) * 10 + (20 - s.avgLen),
        );
        if (best) mapping.categoria = best;
    }

    return mapping;
};

const mappingComplete = (mapping: HeaderMapping) =>
    Boolean(mapping.nombre && mapping.sku && mapping.categoria && mapping.precio && mapping.stock);

const buildProducto = (
    row: Record<string, any>,
    mapping: HeaderMapping,
    rowIndex: number,
): { producto?: ParsedProducto; invalid?: InvalidDetail } => {
    const errors: string[] = [];
    const nombre = String(row[mapping.nombre || ""] ?? "").trim();
    const sku = String(row[mapping.sku || ""] ?? "").trim();
    const categoria = String(row[mapping.categoria || ""] ?? "").trim();
    const precio = toNumber(row[mapping.precio || ""]);
    const stock = toNumber(row[mapping.stock || ""]);
    const descripcion = String(row[mapping.descripcion || ""] ?? "").trim();

    if (!nombre) errors.push("Nombre requerido");
    if (!sku) errors.push("SKU requerido");
    if (!categoria) errors.push("Categoría requerida");
    if (!Number.isFinite(precio) || precio <= 0) errors.push("Precio inválido");
    if (!Number.isFinite(stock) || stock < 0) errors.push("Stock inválido");

    if (errors.length > 0) {
        return {
            invalid: {
                rowIndex,
                errors,
                rawRow: row,
            },
        };
    }

    return {
        producto: {
            nombre,
            sku,
            categoria,
            precio,
            stock,
            descripcion,
        },
    };
};

export const applyMappingAndValidate = (
    rows: Record<string, any>[],
    mapping: HeaderMapping,
): ImportResult => {
    const validProducts: ParsedProducto[] = [];
    const invalidDetails: InvalidDetail[] = [];

    rows.forEach((row, idx) => {
        const { producto, invalid } = buildProducto(row, mapping, idx + 1);
        if (producto) validProducts.push(producto);
        if (invalid) invalidDetails.push(invalid);
    });

    return {
        totalRows: rows.length,
        validRows: validProducts.length,
        invalidRows: invalidDetails.length,
        validProducts,
        invalidDetails,
        headers: Object.keys(rows[0] || {}),
        rows,
        mapping,
        mappingComplete: mappingComplete(mapping),
    };
};

export const parseCSVText = async (text: string): Promise<ImportResult> => {
    return new Promise((resolve) => {
        Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            complete: (results: any) => {
                const rawRows = (results.data as Record<string, any>[]).map(normalizeRow);
                const headers = (results.meta?.fields || []).map((f: string) => normalizeHeader(f));
                const mapping = autoMapHeaders(headers, rawRows);
                resolve(applyMappingAndValidate(rawRows, mapping));
            },
        } as any);
    });
};

export const parseXLSXFile = async (file: File): Promise<ImportResult> => {
    const buffer = await file.arrayBuffer();
    // @ts-ignore: optional dependency loaded at runtime
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<string, any>[];
    const normalizedRows = rows.map(normalizeRow);
    const headers = Object.keys(normalizedRows[0] || {});
    const mapping = autoMapHeaders(headers, normalizedRows);
    return applyMappingAndValidate(normalizedRows, mapping);
};

export const parsePastedList = (text: string): ImportResult => {
    const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    const rows: Record<string, any>[] = lines.map((line, index) => {
        const separator = line.includes("\t") ? "\t" : ",";
        const parts = line.split(separator).map((p) => p.trim());
        const nombre = parts[0] || "";
        const precio = parts[1] ?? "";
        const stock = parts[2] ?? "";
        const sku = parts[3] ?? `SKU_${index + 1}`;
        const categoria = parts[4] ?? "General";
        const descripcion = parts[5] ?? "";
        return {
            nombre,
            precio,
            stock,
            sku,
            categoria,
            descripcion,
        };
    });

    const mapping = autoMapHeaders(Object.keys(rows[0] || {}), rows);

    return applyMappingAndValidate(rows, mapping);
};

export const buildTemplateCSV = () => {
    const headers = ["nombre", "sku", "categoria", "precio", "stock", "descripcion"];
    const rows = [
        ["Arroz 5kg", "ARR-001", "Granos", "18500", "50", "Arroz premium"],
        ["Aceite 1L", "ACE-001", "Despensa", "12000", "40", "Aceite vegetal"],
    ];
    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
};

export const buildErrorsCSV = (invalidDetails: InvalidDetail[]) => {
    const headers = ["fila", "errores", "raw"];
    const rows = invalidDetails.map((detail) => [
        detail.rowIndex,
        detail.errors.join(" | "),
        JSON.stringify(detail.rawRow),
    ]);
    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
};
