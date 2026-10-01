"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";
import {
  cerrarSesion,
  haySesion,
  iniciarSesion,
  passwordCorrecta,
} from "@/lib/stock-auth";

export interface FormState {
  ok: boolean;
  message: string;
}

const MAX_STOCK = 100000;

export async function login(
  _prev: FormState | null,
  formData: FormData
): Promise<FormState> {
  const intento = String(formData.get("password") ?? "");

  if (!passwordCorrecta(intento)) {
    // Frena un poco los intentos de fuerza bruta.
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { ok: false, message: "Contraseña incorrecta" };
  }

  await iniciarSesion();
  return { ok: true, message: "" };
}

export async function logout(): Promise<void> {
  await cerrarSesion();
}

export async function guardarStock(
  _prev: FormState | null,
  formData: FormData
): Promise<FormState> {
  // Las Server Actions son accesibles por POST directo: se valida sesión aquí.
  if (!(await haySesion())) {
    return { ok: false, message: "Sesión expirada. Vuelve a entrar." };
  }

  const ids = formData.getAll("id").map(String);
  const updates: { id: number; stock: number | null; disponible: boolean }[] = [];

  for (const rawId of ids) {
    const id = Number(rawId);
    if (!Number.isInteger(id)) {
      return { ok: false, message: "Datos inválidos" };
    }

    // Campo vacío = sin límite de stock (NULL).
    const rawStock = String(formData.get(`stock_${id}`) ?? "").trim();
    let stock: number | null = null;
    if (rawStock !== "") {
      stock = Number(rawStock);
      if (!Number.isInteger(stock) || stock < 0 || stock > MAX_STOCK) {
        return {
          ok: false,
          message: "El stock debe ser un número entero de 0 en adelante",
        };
      }
    }

    // Un checkbox sin marcar no se envía en el formulario.
    const disponible = formData.get(`disponible_${id}`) === "on";
    updates.push({ id, stock, disponible });
  }

  const supabase = getSupabase();
  const results = await Promise.all(
    updates.map((u) =>
      supabase
        .from("productos")
        .update({ stock: u.stock, disponible: u.disponible })
        .eq("id", u.id)
    )
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    console.error("[stock] Error al guardar:", failed.error.message);
    return { ok: false, message: "No se pudo guardar. Intenta de nuevo." };
  }

  revalidatePath("/stock");
  return { ok: true, message: "Cambios guardados" };
}
