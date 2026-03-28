/**
 * BarcodeService - Stub para frontend
 */

export const barcodeService = {
  generateBarcode(productId: string): string {
    return `BAR-${productId.slice(0, 8).toUpperCase()}`;
  },
  
  validateBarcode(barcode: string): boolean {
    return /^BAR-[A-Z0-9]{8}$/.test(barcode);
  },
};
