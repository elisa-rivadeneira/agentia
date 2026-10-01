import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const STOCK_COOKIE = "stock_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

function getPassword(): string {
  const password = process.env.STOCK_PANEL_PASSWORD;
  if (!password) {
    throw new Error("Falta la variable de entorno STOCK_PANEL_PASSWORD");
  }
  return password;
}

// El valor de la cookie es un HMAC derivado de la contraseña, así la
// contraseña nunca viaja ni se guarda en el navegador, y cambiarla en el
// entorno invalida todas las sesiones.
function sessionToken(password: string): string {
  return createHmac("sha256", password).update("stock-panel-session").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function passwordCorrecta(intento: string): boolean {
  return safeEqual(intento, getPassword());
}

export async function iniciarSesion(): Promise<void> {
  const store = await cookies();
  store.set(STOCK_COOKIE, sessionToken(getPassword()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/stock",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function cerrarSesion(): Promise<void> {
  const store = await cookies();
  store.delete({ name: STOCK_COOKIE, path: "/stock" });
}

export async function haySesion(): Promise<boolean> {
  const value = (await cookies()).get(STOCK_COOKIE)?.value;
  if (!value) return false;
  return safeEqual(value, sessionToken(getPassword()));
}
