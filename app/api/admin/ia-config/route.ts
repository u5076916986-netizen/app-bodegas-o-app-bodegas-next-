import { NextResponse } from "next/server";
import { readIaConfig, writeIaConfig } from "@/lib/iaConfig";

export async function GET() {
  try {
    const config = await readIaConfig();
    return NextResponse.json({ ok: true, config });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "No se pudo leer la configuración" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = {
      ia_enabled: Boolean(body.ia_enabled),
      system_prompt: body.system_prompt ?? "",
      analysis_goals: Array.isArray(body.analysis_goals)
        ? body.analysis_goals.map(String)
        : [],
    };
    await writeIaConfig(updated);
    return NextResponse.json({ ok: true, config: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "No se pudo guardar la configuración" },
      { status: 500 },
    );
  }
}
