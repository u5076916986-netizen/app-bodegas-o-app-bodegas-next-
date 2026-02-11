import path from "path";
import { promises as fs } from "fs";
import type { Cupon } from "./cupones";

export async function getCupones(): Promise<Cupon[]> {
  try {
    const filePath = path.join(process.cwd(), "data", "cupones.json");
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as Cupon[];
  } catch (error) {
    console.warn("Error leyendo cupones.json", error);
    return [];
  }
}
