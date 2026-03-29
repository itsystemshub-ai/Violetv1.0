/**
 * Violet ERP - Capa de Base de Datos
 * 
 * Soporte múltiple: SQLite (local), PostgreSQL (producción), Supabase
 */

import Database from 'better-sqlite3';
import postgres from 'postgres';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

// ============================================================================
# CONFIGURACIÓN
// ============================================================================

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface DatabaseConfig {
  type: 'sqlite' | 'postgres' | 'supabase';
  sqlitePath?: string;
  postgresUrl?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

// ============================================================================
# SQLITE (Desarrollo / Local)
// ============================================================================

export class SqliteDatabase {
  private db: Database.Database | null = null;
  private readonly dbPath: string;

  constructor(dbPath: string = ':memory:') {
    this.dbPath = dbPath;
  }

  connect(): Database.Database {
    if (!this.db) {
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');
      this.enableForeignKeys();
    }
    return this.db;
  }

  disconnect(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  getConnection(): Database.Database {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  private enableForeignKeys(): void {
    this.db?.exec('PRAGMA foreign_keys = ON');
  }

  transaction<T>(fn: () => T): T {
    const conn = this.getConnection();
    return conn.transaction(fn)();
  }

  prepare(sql: string): Database.Statement {
    return this.getConnection().prepare(sql);
  }

  exec(sql: string): void {
    this.getConnection().exec(sql);
  }

  query<T = unknown>(sql: string, params?: unknown[]): T[] {
    const stmt = this.prepare(sql);
    return stmt.all(...(params || [])) as T[];
  }

  queryOne<T = unknown>(sql: string, params?: unknown[]): T | undefined {
    const stmt = this.prepare(sql);
    return stmt.get(...(params || [])) as T | undefined;
  }

  mutate(sql: string, params?: unknown[]): Database.RunResult {
    const stmt = this.prepare(sql);
    return stmt.run(...(params || []));
  }

  insert(table: string, data: Record<string, unknown>): number {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const result = this.mutate(sql, values);
    return result.lastInsertRowid as number;
  }

  update(table: string, data: Record<string, unknown>, where: string, whereParams?: unknown[]): number {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key) => `${key} = ?`).join(', ');
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
    const result = this.mutate(sql, [...values, ...(whereParams || [])]);
    return result.changes;
  }

  delete(table: string, where: string, whereParams?: unknown[]): number {
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    const result = this.mutate(sql, whereParams || []);
    return result.changes;
  }

  exists(table: string, where: string, whereParams?: unknown[]): boolean {
    const sql = `SELECT 1 FROM ${table} WHERE ${where} LIMIT 1`;
    const result = this.queryOne(sql, whereParams);
    return !!result;
  }

  count(table: string, where?: string, whereParams?: unknown[]): number {
    const whereClause = where ? `WHERE ${where}` : '';
    const sql = `SELECT COUNT(*) as count FROM ${table} ${whereClause}`;
    const result = this.queryOne<{ count: number }>(sql, whereParams);
    return result?.count || 0;
  }

  backup(backupPath: string): void {
    const backup = new Database(backupPath);
    this.getConnection().backup(backup);
    backup.close();
  }
}

// ============================================================================
# POSTGRESQL (Producción)
// ============================================================================

export class PostgresDatabase {
  private sql: postgres.Sql | null = null;
  private readonly connectionString: string;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
  }

  async connect(): Promise<postgres.Sql> {
    if (!this.sql) {
      this.sql = postgres(this.connectionString, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 5,
      });
    }
    return this.sql;
  }

  async disconnect(): Promise<void> {
    if (this.sql) {
      await this.sql.end();
      this.sql = null;
    }
  }

  async getConnection(): Promise<postgres.Sql> {
    if (!this.sql) {
      await this.connect();
    }
    return this.sql!;
  }

  async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    const conn = await this.getConnection();
    const result = await conn<T>(sql, params);
    return result;
  }

  async queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | undefined> {
    const result = await this.query<T>(sql, params);
    return result[0];
  }

  async mutate(sql: string, params?: unknown[]): Promise<number> {
    const conn = await this.getConnection();
    const result = await conn(sql, params);
    return result.count || 0;
  }

  async transaction<T>(fn: (sql: postgres.Sql) => Promise<T>): Promise<T> {
    const conn = await this.getConnection();
    return conn.transaction(async (client) => fn(client));
  }

  async insert<T = { id: string }>(table: string, data: Record<string, unknown>, returning = 'id'): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING ${returning}`;
    const result = await this.queryOne<T>(sql, values);
    return result!;
  }

  async update(table: string, data: Record<string, unknown>, where: string, whereParams?: unknown[]): Promise<number> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const paramCount = values.length;
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const whereClause = where.replace(/\?/g, (_, i) => `$${paramCount + i + 1}`);
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    const result = await this.mutate(sql, [...values, ...(whereParams || [])]);
    return result;
  }

  async delete(table: string, where: string, whereParams?: unknown[]): Promise<number> {
    const whereClause = where.replace(/\?/g, (_, i) => `$${i + 1}`);
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    const result = await this.mutate(sql, whereParams || []);
    return result;
  }
}

// ============================================================================
# SUPABASE
// ============================================================================

export class SupabaseDatabase {
  private client: SupabaseClient | null = null;
  private readonly supabaseUrl: string;
  private readonly supabaseKey: string;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
  }

  getClient(): SupabaseClient {
    if (!this.client) {
      this.client = createClient(this.supabaseUrl, this.supabaseKey);
    }
    return this.client;
  }

  async query<T = unknown>(table: string, options?: {
    select?: string;
    where?: Record<string, unknown>;
    limit?: number;
    offset?: number;
    orderBy?: { column: string; ascending?: boolean };
  }): Promise<T[]> {
    const client = this.getClient();
    let query = client.from(table).select(options?.select || '*');

    if (options?.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    if (options?.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true });
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }

    return data as T[];
  }

  async queryOne<T = unknown>(table: string, where: Record<string, unknown>): Promise<T | null> {
    const result = await this.query<T>(table, { where, limit: 1 });
    return result[0] || null;
  }

  async insert<T = { id: string }>(table: string, data: Record<string, unknown>): Promise<T> {
    const client = this.getClient();
    const { data: result, error } = await client
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase insert error: ${error.message}`);
    }

    return result as T;
  }

  async update<T = { id: string }>(
    table: string,
    data: Record<string, unknown>,
    where: Record<string, unknown>
  ): Promise<T> {
    const client = this.getClient();
    let query = client.from(table).update(data);

    Object.entries(where).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data: result, error } = await query.select().single();

    if (error) {
      throw new Error(`Supabase update error: ${error.message}`);
    }

    return result as T;
  }

  async delete(table: string, where: Record<string, unknown>): Promise<void> {
    const client = this.getClient();
    let query = client.from(table).delete();

    Object.entries(where).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { error } = await query;

    if (error) {
      throw new Error(`Supabase delete error: ${error.message}`);
    }
  }
}

// ============================================================================
# FÁBRICA DE BASE DE DATOS
// ============================================================================

export type AnyDatabase = SqliteDatabase | PostgresDatabase | SupabaseDatabase;

export function createDatabase(config: DatabaseConfig): AnyDatabase {
  switch (config.type) {
    case 'sqlite':
      return new SqliteDatabase(config.sqlitePath || ':memory:');
    case 'postgres':
      if (!config.postgresUrl) {
        throw new Error('PostgreSQL connection string is required');
      }
      return new PostgresDatabase(config.postgresUrl);
    case 'supabase':
      if (!config.supabaseUrl || !config.supabaseKey) {
        throw new Error('Supabase URL and key are required');
      }
      return new SupabaseDatabase(config.supabaseUrl, config.supabaseKey);
    default:
      throw new Error(`Unknown database type: ${(config as DatabaseConfig).type}`);
  }
}

// ============================================================================
# INSTANCIA POR DEFECTO
// ============================================================================

const defaultDbType = process.env.DB_TYPE as 'sqlite' | 'postgres' | 'supabase' || 'sqlite';
const defaultConfig: DatabaseConfig = {
  type: defaultDbType,
  sqlitePath: process.env.SQLITE_PATH || path.join(__dirname, '../../violet.db'),
  postgresUrl: process.env.DATABASE_URL,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY,
};

export const db = createDatabase(defaultConfig);

export default db;
