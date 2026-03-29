/**
 * checksumService.ts
 * Genera hashes SHA-256 usando la Web Crypto API nativa.
 * 100% gratuita, sin API key, funciona en Electron y navegador.
 */

/**
 * Genera un hash SHA-256 de cualquier string (ej: JSON exportado).
 * Útil para verificar integridad de exportaciones.
 */
export const generateSHA256 = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

/**
 * Verifica que un dato no ha sido alterado comparando su hash actual
 * con uno previamente guardado.
 */
export const verifyIntegrity = async (
  data: string,
  expectedHash: string
): Promise<boolean> => {
  const actual = await generateSHA256(data);
  return actual === expectedHash;
};

/**
 * Genera un short hash (primeros 8 chars) para mostrar en UI.
 */
export const shortHash = async (data: string): Promise<string> => {
  const full = await generateSHA256(data);
  return full.slice(0, 8).toUpperCase();
};
