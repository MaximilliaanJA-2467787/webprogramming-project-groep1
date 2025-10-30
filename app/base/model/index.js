const { databaseRef } = require('../database');
const qident = require('../../utils/qident');

/**
 * BaseModel
 */
class BaseModel {
    static db = databaseRef;

    constructor() {
        // Derived should do: static tableName = '...';
    }

    // Helper to get class table name (throws if not provided)
    static _tableName() {
        if (this.tableName && typeof this.tableName === 'string') return this.tableName;
        throw new Error(`Model ${this.name} must define static tableName`);
    }

    static _db() {
        return this.db || databaseRef;
    }

    // --- Static CRUD / query methods (recommended) ---

    static async getById(id) {
        const table = qident(this._tableName());
        const sql = `SELECT * FROM ${table} WHERE id = ?`;
        try {
            const row = this._db().get(sql, [id]);
            return row || null;
        } catch (err) {
            throw new Error(`Error in ${this.name}.getById: ${err.message}`);
        }
    }

    /**
     * getAll(conditions = {}, options = {})
     * - conditions: { col: value, ... } (ANDed)
     * - options: { orderBy, orderDirection, limit, offset }
     * orderBy can be string or array of strings.
     */
    static async getAll(conditions = {}, options = {}) {
        const table = qident(this._tableName());
        let sql = `SELECT * FROM ${table}`;
        const params = [];

        if (Object.keys(conditions).length > 0) {
            const whereParts = [];
            for (const [k, v] of Object.entries(conditions)) {
                whereParts.push(`${qident(k)} = ?`);
                params.push(v);
            }
            sql += ` WHERE ${whereParts.join(' AND ')}`;
        }

        if (options.orderBy) {
            const orderBy = Array.isArray(options.orderBy)
                ? options.orderBy.map((c) => qident(c)).join(', ')
                : qident(options.orderBy);
            sql += ` ORDER BY ${orderBy}`;

            const dir = (options.orderDirection || options.orderDirections || 'ASC').toUpperCase();
            if (!['ASC', 'DESC'].includes(dir)) {
                throw new Error('Invalid order direction (must be "ASC" or "DESC")');
            }
            sql += ` ${dir}`;
        }

        if (options.limit !== undefined) {
            const lim = Number(options.limit);
            if (!Number.isFinite(lim) || lim < 0) throw new Error('Invalid limit value');
            sql += ` LIMIT ${lim}`;
            if (options.offset !== undefined) {
                const off = Number(options.offset);
                if (!Number.isFinite(off) || off < 0) throw new Error('Invalid offset value');
                sql += ` OFFSET ${off}`;
            }
        }

        try {
            return this._db().all(sql, params);
        } catch (err) {
            throw new Error(`Error in ${this.name}.getAll: ${err.message}`);
        }
    }

    static async findOne(conditions = {}, options = {}) {
        const opts = Object.assign({}, options, { limit: 1 });
        const rows = await this.getAll(conditions, opts);
        return rows && rows.length ? rows[0] : null;
    }

    static async create(data = {}) {
        const keys = Object.keys(data);
        if (keys.length === 0) throw new Error('No data provided for create');

        const cols = keys.map((k) => qident(k)).join(', ');
        const placeholders = keys.map(() => '?').join(', ');
        const values = keys.map((k) => data[k]);

        const sql = `INSERT INTO ${qident(this._tableName())} (${cols}) VALUES (${placeholders})`;
        try {
            const info = this._db().run(sql, values);
            const insertedId =
                info && typeof info.lastInsertRowid !== 'undefined' ? info.lastInsertRowid : null;
            if (insertedId === null) {
                return null;
            }
            return await this.getById(insertedId);
        } catch (err) {
            throw new Error(`Error in ${this.name}.create: ${err.message}`);
        }
    }

    static async update(id, data = {}) {
        const keys = Object.keys(data);
        if (keys.length === 0) throw new Error('No data provided for update');

        const setParts = keys.map((k) => `${qident(k)} = ?`).join(', ');
        const values = keys.map((k) => data[k]);
        values.push(id);

        const sql = `UPDATE ${qident(this._tableName())} SET ${setParts} WHERE id = ?`;
        try {
            const info = this._db().run(sql, values);
            if (!info || info.changes === 0) return null;
            return await this.getById(id);
        } catch (err) {
            throw new Error(`Error in ${this.name}.update: ${err.message}`);
        }
    }

    static async delete(id) {
        const sql = `DELETE FROM ${qident(this._tableName())} WHERE id = ?`;
        try {
            return this._db().run(sql, [id]);
        } catch (err) {
            throw new Error(`Error in ${this.name}.delete: ${err.message}`);
        }
    }

    static async count(conditions = {}) {
        let sql = `SELECT COUNT(*) AS cnt FROM ${qident(this._tableName())}`;
        const params = [];
        if (Object.keys(conditions).length > 0) {
            const whereParts = [];
            for (const [k, v] of Object.entries(conditions)) {
                whereParts.push(`${qident(k)} = ?`);
                params.push(v);
            }
            sql += ` WHERE ${whereParts.join(' AND ')}`;
        }
        try {
            const row = this._db().get(sql, params);
            return row ? row.cnt : 0;
        } catch (err) {
            throw new Error(`Error in ${this.name}.count: ${err.message}`);
        }
    }

    async getById(id) {
        return this.constructor.getById(id);
    }
    async getAll(conditions = {}, options = {}) {
        return this.constructor.getAll(conditions, options);
    }
    async findOne(conditions = {}, options = {}) {
        return this.constructor.findOne(conditions, options);
    }
    async create(data = {}) {
        return this.constructor.create(data);
    }
    async update(id, data = {}) {
        return this.constructor.update(id, data);
    }
    async delete(id) {
        return this.constructor.delete(id);
    }
    async count(conditions = {}) {
        return this.constructor.count(conditions);
    }
}

module.exports = BaseModel;
