import path from "path";
import { promises as fs } from "fs";

export type IaConfig = {
  ia_enabled: boolean;
  system_prompt: string;
  analysis_goals: string[];
};

const CONFIG_PATH = path.join(process.cwd(), "data", "ia_config.json");

export async function readIaConfig(): Promise<IaConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (
      typeof parsed.ia_enabled === "boolean" &&
      typeof parsed.system_prompt === "string" &&
      Array.isArray(parsed.analysis_goals)
    ) {
      return parsed;
    }
  } catch (err) {
    console.warn("No se pudo leer data/ia_config.json, usando default", err);
  }
  const fallback: IaConfig = {
    ia_enabled: false,
    system_prompt: "",
    analysis_goals: [],
  };
  return fallback;
}

export async function writeIaConfig(config: IaConfig) {
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}
