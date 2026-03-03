import { Product, Warehouse } from './index';

export class InventoryService {
  /**
   * Calculates the available stock for a combo product based on its components.
   */
  static calculateComboStock(combo: Product, allProducts: Product[]): number {
    if (!combo.isCombo || !combo.components || combo.components.length === 0) {
      return combo.stock;
    }

    const stocks = combo.components.map(comp => {
      const componentProduct = allProducts.find(p => p.id === comp.productId);
      if (!componentProduct) return 0;
      
      // Stock total del componente
      const totalComponentStock = this.getTotalStock(componentProduct);
      return Math.floor(totalComponentStock / comp.quantity);
    });

    return stocks.length > 0 ? Math.min(...stocks) : 0;
  }

  /**
   * Aggregates total stock for a product across all warehouses.
   */
  static getTotalStock(product: Product): number {
    if (product.isCombo) {
        // El stock de un combo no se suma, se calcula dinámicamente.
        // Pero si se guarda el valor calculado, lo devolvemos.
        return product.stock;
    }
    
    if (!product.warehouseStocks || product.warehouseStocks.length === 0) {
      return product.stock;
    }
    return product.warehouseStocks.reduce((acc, ws) => acc + ws.stock, 0);
  }

  /**
   * Gets the stock of a product in a specific warehouse.
   */
  static getStockInWarehouse(product: Product, warehouseId: string): number {
    if (!product.warehouseStocks) return product.warehouseId === warehouseId ? product.stock : 0;
    const ws = product.warehouseStocks.find(s => s.warehouseId === warehouseId);
    return ws ? ws.stock : 0;
  }

  /**
   * List of default warehouses for the system.
   * In a real app, these would come from the DB.
   */
  static getDefaultWarehouses(): Warehouse[] {
    return [
      { id: 'wh-main', name: 'Almacén Principal (Cauplas)', isMain: true },
      { id: 'wh-dist', name: 'Centro de Distribución', isMain: false },
      { id: 'wh-tienda', name: 'Tienda / Showroom', isMain: false },
    ];
  }
}
