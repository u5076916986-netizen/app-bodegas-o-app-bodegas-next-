import fs from 'fs/promises';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'data', 'ia_config.json');

export type IaConfig = {
    ia_enabled: boolean;
    system_prompt: string;
    analysis_goals: string[];
    output_format_version: number;
};

const DEFAULT_CONFIG: IaConfig = {
    ia_enabled: false,
    system_prompt: "Eres un asesor para tenderos colombianos. Analiza la imagen y sugiere mejoras prácticas.",
    analysis_goals: [
        "Mejorar la iluminación",
        "Sugerir colocación de productos de mayor rotación",
        "Detectar signos de falta de limpieza o organización",
        "Revisar visibilidad de precios"
    ],
    output_format_version: 1
};

export async function readIaConfig(): Promise<IaConfig> {
    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return DEFAULT_CONFIG;
    }
}

export async function writeIaConfig(config: IaConfig): Promise<void> {
    const dir = path.dirname(CONFIG_PATH);
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}