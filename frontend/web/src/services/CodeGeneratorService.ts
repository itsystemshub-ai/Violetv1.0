/**
 * CodeGeneratorService - Servicio para generar códigos automáticos
 * Genera códigos únicos para clientes, vendedores, pedidos y facturas
 */

export class CodeGeneratorService {
  private static counters: Record<string, number> = {
    client: 1,
    salesperson: 1,
    order: 1,
    invoice: 1,
  };

  /**
   * Genera código automático para cliente
   * Formato: CLI-NNNN
   */
  static generateClientCode(): string {
    const number = String(this.counters.client++).padStart(4, '0');
    return `CLI-${number}`;
  }

  /**
   * Genera código automático para vendedor
   * Formato: VEN-NNNN
   */
  static generateSalespersonCode(): string {
    const number = String(this.counters.salesperson++).padStart(4, '0');
    return `VEN-${number}`;
  }


  /**
   * Genera código automático para pedido
   * Formato: PED-NNNN
   */
  static generateOrderCode(): string {
    const number = String(this.counters.order++).padStart(4, '0');
    return `PED-${number}`;
  }

  /**
   * Genera código automático para factura
   * Formato: FAC-NNNN
   */
  static generateInvoiceCode(): string {
    const number = String(this.counters.invoice++).padStart(4, '0');
    return `FAC-${number}`;
  }

  /**
   * Inicializa los contadores desde la base de datos
   * Debe llamarse al iniciar la aplicación
   */
  static async initializeCounters() {
    // Simular carga desde localStorage
    const stored = localStorage.getItem('code_counters');
    if (stored) {
      const parsed = JSON.parse(stored);
      this.counters = parsed.counters;
    }
  }

  /**
   * Guarda los contadores actuales
   */
  static saveCounters() {
    localStorage.setItem('code_counters', JSON.stringify({
      counters: this.counters,
    }));
  }

  /**
   * Resetea los contadores (útil para testing)
   */
  static resetCounters() {
    this.counters = {
      client: 1,
      salesperson: 1,
      order: 1,
      invoice: 1,
    };
    this.saveCounters();
  }
}

// Inicializar al cargar el módulo
if (typeof window !== 'undefined') {
  CodeGeneratorService.initializeCounters();
}
