import { localDb } from "@/lib/localDb";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export interface BackupConfig {
  enabled: boolean;
  frequency: "minute" | "hourly" | "daily" | "manual";
  format: "json" | "xlsx" | "sql" | "all";
  autoDownload: boolean;
  maxBackups: number;
  includeImages: boolean;
}

export interface BackupMetadata {
  timestamp: string;
  version: string;
  recordCount: {
    products: number;
    invoices: number;
    customers: number;
    suppliers: number;
    transactions: number;
  };
  checksum: string;
}

export class BackupService {
  private static instance: BackupService;
  private intervalId: NodeJS.Timeout | null = null;
  private config: BackupConfig = {
    enabled: true,
    frequency: "daily",
    format: "all",
    autoDownload: true,
    maxBackups: 30,
    includeImages: false,
  };

  private constructor() {
    this.loadConfig();
    this.startAutoBackup();
  }

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  /**
   * Carga la configuración desde localStorage
   */
  private loadConfig() {
    try {
      const saved = localStorage.getItem("violet-backup-config");
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error("Error loading backup config:", error);
    }
  }

  /**
   * Guarda la configuración en localStorage
   */
  private saveConfig() {
    try {
      localStorage.setItem("violet-backup-config", JSON.stringify(this.config));
    } catch (error) {
      console.error("Error saving backup config:", error);
    }
  }

  /**
   * Actualiza la configuración de backup
   */
  updateConfig(newConfig: Partial<BackupConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
    this.restartAutoBackup();
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): BackupConfig {
    return { ...this.config };
  }

  /**
   * Inicia el backup automático según la frecuencia configurada
   */
  private startAutoBackup() {
    if (!this.config.enabled) return;

    this.stopAutoBackup();

    let interval: number;
    switch (this.config.frequency) {
      case "minute":
        interval = 60 * 1000; // 1 minuto
        break;
      case "hourly":
        interval = 60 * 60 * 1000; // 1 hora
        break;
      case "daily":
        interval = 24 * 60 * 60 * 1000; // 24 horas
        break;
      default:
        return;
    }

    this.intervalId = setInterval(() => {
      this.createBackup();
    }, interval);

    console.log(`✅ Backup automático iniciado: ${this.config.frequency}`);
  }

  /**
   * Detiene el backup automático
   */
  private stopAutoBackup() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Reinicia el backup automático
   */
  private restartAutoBackup() {
    this.stopAutoBackup();
    this.startAutoBackup();
  }

  /**
   * Genera un checksum simple para verificar integridad
   */
  private generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Obtiene todos los datos de la base de datos
   */
  private async getAllData() {
    const [products, invoices, customers, suppliers, transactions] = await Promise.all([
      localDb.products.toArray(),
      localDb.invoices.toArray(),
      localDb.customers.toArray(),
      localDb.suppliers.toArray(),
      localDb.transactions.toArray(),
    ]);

    // Si no se incluyen imágenes, eliminarlas de los productos
    const processedProducts = this.config.includeImages
      ? products
      : products.map((p) => ({ ...p, images: [] }));

    return {
      products: processedProducts,
      invoices,
      customers,
      suppliers,
      transactions,
    };
  }

  /**
   * Genera metadata del backup
   */
  private async generateMetadata(data: any): Promise<BackupMetadata> {
    const dataString = JSON.stringify(data);
    return {
      timestamp: new Date().toISOString(),
      version: "2.0.0",
      recordCount: {
        products: data.products.length,
        invoices: data.invoices.length,
        customers: data.customers.length,
        suppliers: data.suppliers.length,
        transactions: data.transactions.length,
      },
      checksum: this.generateChecksum(dataString),
    };
  }

  /**
   * Crea un backup en formato JSON
   */
  private async createJSONBackup(data: any, metadata: BackupMetadata): Promise<Blob> {
    const backup = {
      metadata,
      data,
    };
    const json = JSON.stringify(backup, null, 2);
    return new Blob([json], { type: "application/json" });
  }

  /**
   * Crea un backup en formato Excel
   */
  private async createExcelBackup(data: any, metadata: BackupMetadata): Promise<Blob> {
    const workbook = XLSX.utils.book_new();

    // Hoja de metadata
    const metadataSheet = XLSX.utils.json_to_sheet([
      { Campo: "Timestamp", Valor: metadata.timestamp },
      { Campo: "Versión", Valor: metadata.version },
      { Campo: "Productos", Valor: metadata.recordCount.products },
      { Campo: "Facturas", Valor: metadata.recordCount.invoices },
      { Campo: "Clientes", Valor: metadata.recordCount.customers },
      { Campo: "Proveedores", Valor: metadata.recordCount.suppliers },
      { Campo: "Transacciones", Valor: metadata.recordCount.transactions },
      { Campo: "Checksum", Valor: metadata.checksum },
    ]);
    XLSX.utils.book_append_sheet(workbook, metadataSheet, "Metadata");

    // Hoja de productos
    if (data.products.length > 0) {
      const productsSheet = XLSX.utils.json_to_sheet(
        data.products.map((p: any) => ({
          ID: p.id,
          Nombre: p.name,
          CAUPLAS: p.cauplas || "",
          TORFLEX: p.torflex || "",
          INDOMAX: p.indomax || "",
          OEM: p.oem || "",
          Categoría: p.category,
          Stock: p.stock,
          "Stock Mínimo": p.minStock,
          "Precio FCA": p.precioFCA || p.price,
          Unidad: p.unit,
          Estado: p.status,
        }))
      );
      XLSX.utils.book_append_sheet(workbook, productsSheet, "Productos");
    }

    // Hoja de facturas
    if (data.invoices.length > 0) {
      const invoicesSheet = XLSX.utils.json_to_sheet(data.invoices);
      XLSX.utils.book_append_sheet(workbook, invoicesSheet, "Facturas");
    }

    // Hoja de clientes
    if (data.customers.length > 0) {
      const customersSheet = XLSX.utils.json_to_sheet(data.customers);
      XLSX.utils.book_append_sheet(workbook, customersSheet, "Clientes");
    }

    // Hoja de proveedores
    if (data.suppliers.length > 0) {
      const suppliersSheet = XLSX.utils.json_to_sheet(data.suppliers);
      XLSX.utils.book_append_sheet(workbook, suppliersSheet, "Proveedores");
    }

    // Hoja de transacciones
    if (data.transactions.length > 0) {
      const transactionsSheet = XLSX.utils.json_to_sheet(data.transactions);
      XLSX.utils.book_append_sheet(workbook, transactionsSheet, "Transacciones");
    }

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    return new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }

  /**
   * Crea un backup en formato SQL (compatible con MySQL/PostgreSQL)
   */
  private async createSQLBackup(data: any, metadata: BackupMetadata): Promise<Blob> {
    let sql = `-- Violet ERP Database Backup
-- Timestamp: ${metadata.timestamp}
-- Version: ${metadata.version}
-- Checksum: ${metadata.checksum}

`;

    // Crear tablas
    sql += `-- Crear tablas
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(500),
  cauplas VARCHAR(100),
  torflex VARCHAR(100),
  indomax VARCHAR(100),
  oem VARCHAR(100),
  category VARCHAR(200),
  stock INT,
  minStock INT,
  precioFCA DECIMAL(10,2),
  price DECIMAL(10,2),
  unit VARCHAR(50),
  status VARCHAR(50)
);

`;

    // Insertar productos
    if (data.products.length > 0) {
      sql += `-- Insertar productos\n`;
      for (const p of data.products) {
        const values = [
          p.id,
          p.name,
          p.cauplas || "",
          p.torflex || "",
          p.indomax || "",
          p.oem || "",
          p.category,
          p.stock,
          p.minStock,
          p.precioFCA || p.price || 0,
          p.price || 0,
          p.unit,
          p.status,
        ]
          .map((v) => (typeof v === "string" ? `'${v.replace(/'/g, "''")}'` : v))
          .join(", ");

        sql += `INSERT INTO products VALUES (${values});\n`;
      }
    }

    sql += `\n-- Backup completado\n`;

    return new Blob([sql], { type: "text/plain" });
  }

  /**
   * Descarga un archivo
   */
  private downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Genera el nombre del archivo de backup
   */
  private generateFilename(format: string): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .replace("T", "_")
      .split(".")[0];
    return `violet_erp_backup_${timestamp}.${format}`;
  }

  /**
   * Crea un backup completo
   */
  async createBackup(manual: boolean = false): Promise<void> {
    try {
      console.log("🔄 Iniciando backup...");

      // Obtener todos los datos
      const data = await this.getAllData();
      const metadata = await this.generateMetadata(data);

      const totalRecords = Object.values(metadata.recordCount).reduce((a, b) => a + b, 0);

      if (totalRecords === 0) {
        console.log("⚠️ No hay datos para respaldar");
        if (manual) {
          toast.warning("No hay datos para respaldar");
        }
        return;
      }

      // Crear backups según el formato configurado
      const formats = this.config.format === "all" ? ["json", "xlsx", "sql"] : [this.config.format];

      for (const format of formats) {
        let blob: Blob;
        let filename: string;

        switch (format) {
          case "json":
            blob = await this.createJSONBackup(data, metadata);
            filename = this.generateFilename("json");
            break;
          case "xlsx":
            blob = await this.createExcelBackup(data, metadata);
            filename = this.generateFilename("xlsx");
            break;
          case "sql":
            blob = await this.createSQLBackup(data, metadata);
            filename = this.generateFilename("sql");
            break;
          default:
            continue;
        }

        // Guardar en IndexedDB para historial
        await this.saveBackupToHistory(filename, blob, metadata);

        // Descargar automáticamente si está configurado
        if (this.config.autoDownload || manual) {
          this.downloadFile(blob, filename);
        }

        console.log(`✅ Backup ${format.toUpperCase()} creado: ${filename}`);
      }

      // Limpiar backups antiguos
      await this.cleanOldBackups();

      if (manual) {
        toast.success(`Backup creado exitosamente (${totalRecords} registros)`);
      }

      console.log(`✅ Backup completado: ${totalRecords} registros`);
    } catch (error) {
      console.error("❌ Error al crear backup:", error);
      if (manual) {
        toast.error("Error al crear backup");
      }
    }
  }

  /**
   * Guarda el backup en el historial (IndexedDB)
   */
  private async saveBackupToHistory(filename: string, blob: Blob, metadata: BackupMetadata) {
    try {
      const backupStore = await localDb.open();
      // Aquí podrías crear una tabla específica para backups si lo deseas
      // Por ahora, solo guardamos en localStorage el registro
      const history = this.getBackupHistory();
      history.unshift({
        filename,
        timestamp: metadata.timestamp,
        size: blob.size,
        recordCount: metadata.recordCount,
      });

      // Mantener solo los últimos N backups en el historial
      const trimmedHistory = history.slice(0, this.config.maxBackups);
      localStorage.setItem("violet-backup-history", JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error("Error saving backup to history:", error);
    }
  }

  /**
   * Obtiene el historial de backups
   */
  getBackupHistory(): any[] {
    try {
      const history = localStorage.getItem("violet-backup-history");
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error("Error loading backup history:", error);
      return [];
    }
  }

  /**
   * Limpia backups antiguos del historial
   */
  private async cleanOldBackups() {
    try {
      const history = this.getBackupHistory();
      if (history.length > this.config.maxBackups) {
        const trimmedHistory = history.slice(0, this.config.maxBackups);
        localStorage.setItem("violet-backup-history", JSON.stringify(trimmedHistory));
        console.log(`🧹 Limpiados ${history.length - this.config.maxBackups} backups antiguos`);
      }
    } catch (error) {
      console.error("Error cleaning old backups:", error);
    }
  }

  /**
   * Restaura un backup desde un archivo
   */
  async restoreBackup(file: File): Promise<boolean> {
    try {
      console.log("🔄 Restaurando backup...");

      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.metadata || !backup.data) {
        throw new Error("Formato de backup inválido");
      }

      // Verificar checksum
      const dataString = JSON.stringify(backup.data);
      const checksum = this.generateChecksum(dataString);

      if (checksum !== backup.metadata.checksum) {
        console.warn("⚠️ Checksum no coincide, el archivo puede estar corrupto");
      }

      // Restaurar datos
      const { products, invoices, customers, suppliers, transactions } = backup.data;

      await localDb.transaction("rw", [localDb.products, localDb.invoices, localDb.customers, localDb.suppliers, localDb.transactions], async () => {
        if (products?.length > 0) await localDb.products.bulkPut(products);
        if (invoices?.length > 0) await localDb.invoices.bulkPut(invoices);
        if (customers?.length > 0) await localDb.customers.bulkPut(customers);
        if (suppliers?.length > 0) await localDb.suppliers.bulkPut(suppliers);
        if (transactions?.length > 0) await localDb.transactions.bulkPut(transactions);
      });

      console.log("✅ Backup restaurado exitosamente");
      toast.success("Backup restaurado exitosamente");
      return true;
    } catch (error) {
      console.error("❌ Error al restaurar backup:", error);
      toast.error("Error al restaurar backup");
      return false;
    }
  }

  /**
   * Detiene el servicio de backup
   */
  destroy() {
    this.stopAutoBackup();
  }
}

// Exportar instancia singleton
export const backupService = BackupService.getInstance();
