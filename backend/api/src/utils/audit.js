/**
 * Violet ERP - Utilidad de Auditoría
 */

import { db } from '@violet-erp/database';

/**
 * Generar un registro de auditoría
 */
export function generateAuditLog(data: {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}): void {
  const id = crypto.randomUUID();
  
  db.mutate(
    `INSERT INTO audit_logs (id, user_id, action, resource, resource_id, changes, ip_address, user_agent, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.userId,
      data.action,
      data.resource,
      data.resourceId,
      data.changes ? JSON.stringify(data.changes) : null,
      data.ipAddress,
      data.userAgent,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ]
  );
}

/**
 * Obtener logs de auditoría
 */
export function getAuditLogs(filters: {
  userId?: string;
  resource?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): unknown[] {
  let sql = `SELECT * FROM audit_logs WHERE 1=1`;
  const params: unknown[] = [];

  if (filters.userId) {
    sql += ` AND user_id = ?`;
    params.push(filters.userId);
  }

  if (filters.resource) {
    sql += ` AND resource = ?`;
    params.push(filters.resource);
  }

  if (filters.action) {
    sql += ` AND action = ?`;
    params.push(filters.action);
  }

  if (filters.startDate) {
    sql += ` AND created_at >= ?`;
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    sql += ` AND created_at <= ?`;
    params.push(filters.endDate);
  }

  sql += ` ORDER BY created_at DESC`;

  if (filters.limit) {
    sql += ` LIMIT ?`;
    params.push(filters.limit);
  }

  if (filters.offset) {
    sql += ` OFFSET ?`;
    params.push(filters.offset);
  }

  return db.query(sql, params);
}
