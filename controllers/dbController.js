import mysql from 'mysql2/promise';
import pg from 'pg';
// import Database from 'better-sqlite3'; // Removed for Windows compatibility
import { AppError } from '../middleware/errorHandler.js';

const connections = new Map();

export const createConnection = async (config) => {
  try {
    let connection;
    const connectionId = `${config.type}_${config.database}_${Date.now()}`;

    switch (config.type) {
      case 'mysql':
        connection = await mysql.createConnection({
          host: config.host,
          port: config.port || 3306,
          user: config.user,
          password: config.password,
          database: config.database,
          connectTimeout: 10000,
          acquireTimeout: 10000,
          timeout: 10000
        });
        // Test connection
        await connection.ping();
        break;

      case 'postgresql':
        const { Pool } = pg;
        connection = new Pool({
          host: config.host,
          port: config.port || 5432,
          user: config.user,
          password: config.password,
          database: config.database,
          connectionTimeoutMillis: 10000,
          idleTimeoutMillis: 10000,
          max: 1
        });
        // Test connection
        const client = await connection.connect();
        client.release();
        break;

      case 'sqlite':
        throw new AppError('SQLite support temporarily disabled on Windows', 400);

      default:
        throw new AppError('Unsupported database type', 400);
    }

    connections.set(connectionId, { connection, type: config.type });
    return connectionId;
  } catch (error) {
    console.error('Database connection error:', error);
    let errorMessage = 'Database connection failed';
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused - Check if database server is running';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Host not found - Check database host address';
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      errorMessage = 'Access denied - Check username and password';
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      errorMessage = 'Database does not exist';
    } else {
      errorMessage = `Database connection failed: ${error.message}`;
    }
    
    throw new AppError(errorMessage, 500);
  }
};

export const executeQuery = async (connectionId, query) => {
  const conn = connections.get(connectionId);
  if (!conn) {
    throw new AppError('Invalid connection ID', 400);
  }

  try {
    let results;

    switch (conn.type) {
      case 'mysql':
        const [rows] = await conn.connection.execute(query);
        results = rows;
        break;

      case 'postgresql':
        const pgResult = await conn.connection.query(query);
        results = pgResult.rows;
        break;

      case 'sqlite':
        throw new AppError('SQLite support temporarily disabled', 400);
    }

    return results;
  } catch (error) {
    throw new AppError(`Query execution failed: ${error.message}`, 500);
  }
};

export const getSchema = async (connectionId) => {
  const conn = connections.get(connectionId);
  if (!conn) {
    throw new AppError('Invalid connection ID', 400);
  }

  try {
    let schema;

    switch (conn.type) {
      case 'mysql':
        const [tables] = await conn.connection.execute(
          "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()"
        );
        
        schema = {};
        for (const table of tables) {
          const [columns] = await conn.connection.execute(
            `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY 
             FROM information_schema.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
            [table.TABLE_NAME]
          );
          schema[table.TABLE_NAME] = columns;
        }
        break;

      case 'postgresql':
        const pgTables = await conn.connection.query(
          `SELECT table_name FROM information_schema.tables 
           WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
        );
        
        schema = {};
        for (const table of pgTables.rows) {
          const pgColumns = await conn.connection.query(
            `SELECT column_name, data_type, is_nullable 
             FROM information_schema.columns 
             WHERE table_name = $1`,
            [table.table_name]
          );
          schema[table.table_name] = pgColumns.rows;
        }
        break;

      case 'sqlite':
        throw new AppError('SQLite support temporarily disabled', 400);
    }

    return schema;
  } catch (error) {
    throw new AppError(`Failed to fetch schema: ${error.message}`, 500);
  }
};

export const closeConnection = (connectionId) => {
  const conn = connections.get(connectionId);
  if (conn) {
    if (conn.type === 'mysql' || conn.type === 'postgresql') {
      conn.connection.end?.() || conn.connection.close?.();
    } else if (conn.type === 'sqlite') {
      conn.connection.close();
    }
    connections.delete(connectionId);
  }
};