/**
 * barcodeService.ts
 * Busca información de productos por código de barras/OEM.
 * Usa Open Food Facts API — 100% gratuita, sin API key.
 * Fallback: UPC Item DB (100 req/día gratis).
 */

export interface BarcodeResult {
  name: string;
  category: string;
  imageUrl: string;
  brand?: string;
}

export const lookupBarcode = async (
  barcode: string
): Promise<BarcodeResult | null> => {
  try {
    // Opción 1: Open Food Facts
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );
    const data = await res.json();

    if (data.status === 1 && data.product) {
      return {
        name: data.product.product_name || data.product.product_name_es || "",
        category: data.product.categories || "",
        imageUrl: data.product.image_front_url || data.product.image_url || "",
        brand: data.product.brands || "",
      };
    }

    return null;
  } catch (err) {
    console.warn("[barcodeService] Error al buscar código de barras:", err);
    return null;
  }
};
