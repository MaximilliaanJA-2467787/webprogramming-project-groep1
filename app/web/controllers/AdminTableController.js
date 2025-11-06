const Logger = require('../../utils/Logger');
const databaseRef = require('../../base/database/index').databaseRef;
const url = require('url');

const tableColumnsCache = new Map();
let allowedTables = null;

/**
 * Load allowed tables from sqlite schema (cached).
 * If you prefer hard-coded whitelist, replace this logic with an array.
 */
async function loadAllowedTables() {
  if (allowedTables) return allowedTables;
  try {
    // sqlite: read table names
    const rows = databaseRef.all(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`);
    allowedTables = new Set(rows.map(r => r.name));
  } catch (err) {
    Logger.error('Failed loading tables list:', err);
    allowedTables = new Set();
  }
  return allowedTables;
}

/**
 * Get columns for a table using PRAGMA (cached)
 * returns array of column names
 */
function getTableColumns(table) {
  if (tableColumnsCache.has(table)) return tableColumnsCache.get(table);

  try {
    const cols = databaseRef.all(`PRAGMA table_info(${table})`); // returns objects with 'name'
    const names = (cols || []).map(c => c.name);
    tableColumnsCache.set(table, names);
    return names;
  } catch (err) {
    Logger.error('Error fetching PRAGMA for table', table, err);
    tableColumnsCache.set(table, []); // avoid retry storm
    return [];
  }
}

/**
 * Basic sanitizer: allow only alphanumeric + underscore table names (extra safety)
 */
function isSafeIdentifier(name) {
  return typeof name === 'string' && /^[A-Za-z0-9_]+$/.test(name);
}

/**
 * Build and run an INSERT for allowed columns present in body
 */
async function create(req, res) {
  const table = req.params && req.params.table;
  if (!isSafeIdentifier(table)) return res.status(400).send('Invalid table');

  const tables = await loadAllowedTables();
  if (!tables.has(table)) return res.status(404).send('Table not found');

  const columns = getTableColumns(table);
  if (!columns || columns.length === 0) return res.status(500).send('Table has no columns or cannot read schema');

  // pick fields from body that match table columns (ignore id/created_at if needed)
  const body = req.body || {};
  const allowedFields = columns.filter(c => c !== 'id' && c !== 'created_at' && Object.prototype.hasOwnProperty.call(body, c));

  if (allowedFields.length === 0) {
    return res.status(400).send('No valid fields provided');
  }

  const placeholders = allowedFields.map(() => '?').join(', ');
  const colsSql = allowedFields.map(c => `"${c}"`).join(', ');
  const values = allowedFields.map(f => body[f]);

  const sql = `INSERT INTO "${table}" (${colsSql}) VALUES (${placeholders})`;

  try {
    const info = databaseRef.run(sql, values);
    const newId = info && info.lastInsertRowid;

    if (req.xhr || req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({ ok: true, id: newId });
    }
    // redirect back to admin table listing (or referrer)
    const redirectTo = req.get('Referer') || `/admin/${table}`;
    return res.redirect(303, redirectTo + '?success=' + encodeURIComponent('Created'));
  } catch (err) {
    Logger.error('Create error', table, err);
    return res.status(500).send('Failed to create row');
  }
}

/**
 * Build and run a DELETE by id
 */
async function remove(req, res) {
  const table = req.params && req.params.table;
  if (!isSafeIdentifier(table)) return res.status(400).send('Invalid table');

  const tables = await loadAllowedTables();
  if (!tables.has(table)) return res.status(404).send('Table not found');

  const id = req.body && (req.body.id || req.body.rowId) ? Number(req.body.id || req.body.rowId) : null;
  if (!id || !Number.isInteger(id)) {
    return res.status(400).send('Missing or invalid id');
  }

  try {
    const sql = `DELETE FROM "${table}" WHERE id = ?`;
    const info = databaseRef.run(sql, [id]);

    if (req.xhr || req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({ ok: true, changes: info && info.changes });
    }

    const referer = req.get('Referer') || `/admin/${table}`;
    return res.redirect(303, referer + '?success=' + encodeURIComponent('Deleted'));
  } catch (err) {
    Logger.error('Delete error', table, err);
    return res.status(500).send('Failed to delete row');
  }
}

/**
 * Build and run an UPDATE by id for allowed columns
 */
async function edit(req, res) {
  const table = req.params && req.params.table;
  if (!isSafeIdentifier(table)) return res.status(400).send('Invalid table');

  const tables = await loadAllowedTables();
  if (!tables.has(table)) return res.status(404).send('Table not found');

  const body = req.body || {};
  const id = body.id ? Number(body.id) : null;
  if (!id || !Number.isInteger(id)) {
    return res.status(400).send('Missing or invalid id');
  }

  const columns = getTableColumns(table);
  if (!columns || columns.length === 0) return res.status(500).send('Table has no columns or cannot read schema');

  // Pick updatable fields (exclude id and created_at)
  const updatable = columns.filter(c => c !== 'id' && c !== 'created_at' && Object.prototype.hasOwnProperty.call(body, c));
  if (updatable.length === 0) {
    return res.status(400).send('No valid fields to update');
  }

  const setClauses = updatable.map(c => `"${c}" = ?`).join(', ');
  const values = updatable.map(c => body[c]);
  values.push(id); // for WHERE id = ?

  const sql = `UPDATE "${table}" SET ${setClauses} WHERE id = ?`;

  try {
    const info = databaseRef.run(sql, values);

    if (req.xhr || req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({ ok: true, changes: info && info.changes });
    }

    const referer = req.get('Referer') || `/admin/${table}`;
    return res.redirect(303, referer + '?success=' + encodeURIComponent('Updated'));
  } catch (err) {
    Logger.error('Edit error', table, err);
    return res.status(500).send('Failed to update row');
  }
}

module.exports = {
  create,
  delete: remove,
  edit,
};
