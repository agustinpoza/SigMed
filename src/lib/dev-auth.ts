/**
 * Bypass de Clerk SOLO para desarrollo local. Con `DEV_AUTH_AS=<email>` en el
 * `.env` y `next dev`, el portal entra como ese usuario de la base sin pasar por
 * Clerk. En producción (`next build` / `next start`) se ignora siempre.
 * Para volver a usar Clerk alcanza con borrar la variable.
 */
export function devAuthEmail(): string | null {
  if (process.env.NODE_ENV !== "development") return null;

  const email = process.env.DEV_AUTH_AS?.trim();
  return email ? email : null;
}
