"use server";

import { revalidatePath } from "next/cache";
import { parseCriticalLevelInput, setCriticalLevel, VaccineServiceError } from "@/services/vaccineService";

export type CriticalLevelState = {
  error?: string;
  message?: string;
};

export async function saveCriticalLevel(
  _prev: CriticalLevelState,
  formData: FormData,
): Promise<CriticalLevelState> {
  const vaccineId = String(formData.get("vaccineId") ?? "").trim();
  if (!vaccineId) return { error: "Seleccioná una vacuna del inventario." };

  const raw = formData.get("criticalLevel");
  try {
    const criticalLevel = parseCriticalLevelInput(typeof raw === "string" ? raw : raw);
    await setCriticalLevel(vaccineId, criticalLevel);
  } catch (e) {
    if (e instanceof VaccineServiceError) return { error: e.message };
    throw e;
  }

  revalidatePath("/enfermera/umbral-critico");
  revalidatePath("/enfermera/vacunas");
  return { message: "Nivel crítico actualizado." };
}
