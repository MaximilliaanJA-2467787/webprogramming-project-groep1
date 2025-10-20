const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');


let db = null;

function init() {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(config.databasePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Connect to database
    db = new Database(config.databasePath);
    
    db.pragma("journal_mode = WAL;");
    db.pragma("busy_timeout = 5000;");
    db.pragma("synchronous = NORMAL;");
    db.pragma("cache_size = 1000000000;");
    db.pragma("foreign_keys = true;");
    db.pragma("temp_store = memory;");
    
    console.log(`Database connected: ${config.databasePath}`);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

// Queries

// Execute a raw SQL query
function query(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.all(params);
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

// Execute a raw SQL query and return first row
function queryOne(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.get(params);
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

// Execute a raw SQL statement (INSERT, UPDATE, DELETE)
function execute(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.run(params);
  } catch (error) {
    console.error('Execute error:', error);
    throw error;
  }
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call init() first.');
  }
  return db;
}

function close() {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}


module.exports = {
  init,
  getDB,
  query,
  queryOne,
  execute,
  close
};
