const BaseModel = require('../../base/model');
const qident = require('../../utils/qident');
const Logger = require('../../utils/Logger');

/**
 * TransactionModel - represents transactions & analytics helpers
 * Table: Transactions
 */
class TransactionModel extends BaseModel {
    static tableName = 'Transactions';

    /**
     * Create a transaction.
     * payload: {
     *   uuid, walletSource_id, walletDestination_id,
     *   type, amount_tokens, item_id, vendor_id, location, metadata, status
     * }
     */
    static async createTransaction(payload = {}) {
        if (!payload.uuid) throw new Error('uuid is required');
        if (!payload.type) throw new Error('type is required');
        if (typeof payload.amount_tokens === 'undefined')
            throw new Error('amount_tokens is required');

        // allow metadata object -> stringify
        const data = Object.assign({}, payload);
        if (data.metadata && typeof data.metadata !== 'string') {
            try {
                data.metadata = JSON.stringify(data.metadata);
            } catch (e) {
                // leave as-is
            }
        }

        try {
            return this.create(data);
        } catch (err) {
            throw new Error(`Error in ${this.name}.createTransaction: ${err.message}`);
        }
    }

    /**
     * Get recent transactions for a vendor, joined with item and user info.
     * options: { limit=10, offset=0, status, since (ISO string) }
     */
    static async getRecentByVendor(vendorId, options = {}) {
        const limit = Number.isFinite(Number(options.limit)) ? Number(options.limit) : 10;
        const offset = Number.isFinite(Number(options.offset)) ? Number(options.offset) : 0;
        const params = [vendorId];

        let sql = `
      SELECT
        t.*,
        i.name AS item_name,
        u.name AS user_name,
        u.email AS user_email
      FROM ${qident(this._tableName())} t
      LEFT JOIN ${qident('Items')} i ON t.item_id = i.id
      LEFT JOIN ${qident('Wallets')} w ON t.walletSource_id = w.id
      LEFT JOIN ${qident('Users')} u ON w.user_id = u.id
      WHERE t.vendor_id = ?
    `;

        if (options.status) {
            sql += ` AND t.status = ?`;
            params.push(options.status);
        }
        if (options.type) {
            sql += ` AND t.type = ?`;
            params.push(options.type);
        }
        if (options.since) {
            sql += ` AND t.timestamp >= ?`;
            params.push(options.since);
        }

        sql += ` ORDER BY t.timestamp DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        try {
            return this._db().all(sql, params);
        } catch (err) {
            throw new Error(`Error in ${this.name}.getRecentByVendor: ${err.message}`);
        }
    }

    /**
     * Count transactions for a vendor (optional filters)
     * conditions: { status, type, since }
     */
    static async countByVendor(vendorId, conditions = {}) {
        const params = [vendorId];
        let sql = `SELECT COUNT(1) AS cnt FROM ${qident(this._tableName())} t WHERE t.vendor_id = ?`;

        if (conditions.status) {
            sql += ` AND t.status = ?`;
            params.push(conditions.status);
        }
        if (conditions.type) {
            sql += ` AND t.type = ?`;
            params.push(conditions.type);
        }
        if (conditions.since) {
            sql += ` AND t.timestamp >= ?`;
            params.push(conditions.since);
        }

        try {
            const row = this._db().get(sql, params);
            return row ? row.cnt : 0;
        } catch (err) {
            throw new Error(`Error in ${this.name}.countByVendor: ${err.message}`);
        }
    }

    /**
     * Sum of tokens sold for vendor (optionally since date)
     * Only counts purchase-type transactions and completed status by default, but can be overridden.
     * opts: { since, status = 'completed', type = 'purchase' }
     */
    static async getTokensSoldForVendor(vendorId, opts = {}) {
        const type = opts.type || 'purchase';
        const status = typeof opts.status === 'undefined' ? 'completed' : opts.status;
        const params = [vendorId, type];

        let sql = `SELECT IFNULL(SUM(t.amount_tokens), 0) AS total FROM ${qident(this._tableName())} t WHERE t.vendor_id = ? AND t.type = ?`;

        if (status !== null) {
            sql += ` AND t.status = ?`;
            params.push(status);
        }

        if (opts.since) {
            sql += ` AND t.timestamp >= ?`;
            params.push(opts.since);
        }

        try {
            const row = this._db().get(sql, params);
            return row ? Number(row.total) : 0;
        } catch (err) {
            throw new Error(`Error in ${this.name}.getTokensSoldForVendor: ${err.message}`);
        }
    }

    /**
     * Unique visitors (distinct wallet->user) for vendor
     * opts: { since }
     */
    static async getUniqueVisitorsCount(vendorId, opts = {}) {
        const params = [vendorId];
        let sql = `
      SELECT COUNT(DISTINCT w.user_id) AS cnt
      FROM ${qident(this._tableName())} t
      LEFT JOIN ${qident('Wallets')} w ON t.walletSource_id = w.id
      WHERE t.vendor_id = ?
    `;

        if (opts.since) {
            sql += ` AND t.timestamp >= ?`;
            params.push(opts.since);
        }

        try {
            const row = this._db().get(sql, params);
            return row ? Number(row.cnt) : 0;
        } catch (err) {
            throw new Error(`Error in ${this.name}.getUniqueVisitorsCount: ${err.message}`);
        }
    }

    /**
     * Top item for a vendor (by count or by revenue)
     * opts: { since, metric = 'count'|'revenue' }
     * returns { item_id, name, count, revenue }
     */
    static async getTopItemForVendor(vendorId, opts = {}) {
        const metric = opts.metric || 'count';
        const since = opts.since;
        const params = [vendorId];

        let agg;
        if (metric === 'revenue') {
            agg = `SUM(t.amount_tokens) AS revenue, COUNT(1) AS count`;
        } else {
            agg = `COUNT(1) AS count, SUM(t.amount_tokens) AS revenue`;
        }

        let sql = `
      SELECT t.item_id, i.name AS name, ${agg}
      FROM ${qident(this._tableName())} t
      LEFT JOIN ${qident('Items')} i ON t.item_id = i.id
      WHERE t.vendor_id = ? AND t.item_id IS NOT NULL
    `;

        if (since) {
            sql += ` AND t.timestamp >= ?`;
            params.push(since);
        }

        sql += ` GROUP BY t.item_id ORDER BY ${metric === 'revenue' ? 'revenue' : 'count'} DESC LIMIT 1`;

        try {
            const row = this._db().get(sql, params);
            return row || null;
        } catch (err) {
            throw new Error(`Error in ${this.name}.getTopItemForVendor: ${err.message}`);
        }
    }

    static async getByUuid(uuid) {
        const sql = `SELECT * FROM ${qident(this._tableName())} WHERE uuid = ?`;
        try {
            const row = this._db().get(sql, [uuid]);
            return row || null;
        } catch (err) {
            throw new Error(`Error in ${this.name}.getByUuid: ${err.message}`);
        }
    }

    static async markCompletedById(id) {
        const sql = `UPDATE ${qident(this._tableName())} SET status = 'completed', timestamp = CURRENT_TIMESTAMP WHERE id = ?`;
        try {
            const info = this._db().run(sql, [id]);
            if (!info || info.changes === 0) return null;
            return this.getById(id);
        } catch (err) {
            throw new Error(`Error in ${this.name}.markCompletedById: ${err.message}`);
        }
    }

    /**
     * Get transactions with geolocation for a vendor (for map display)
     */
    static async getTransactionsWithGeoForVendor(vendorId) {
        const sql = `
      SELECT t.*, i.name AS item_name
      FROM ${qident(this._tableName())} t
      LEFT JOIN ${qident('Items')} i ON t.item_id = i.id
      WHERE t.vendor_id = ? AND t.status = 'completed' AND t.metadata IS NOT NULL
      ORDER BY t.timestamp DESC
    `;
        try {
            const rows = this._db().all(sql, [vendorId]);
            // Parse metadata to extract lat/lng/alt
            return rows
                .map((row) => {
                    let geo = { lat: null, lng: null, alt: null, location_note: null };
                    if (row.metadata) {
                        try {
                            const meta = JSON.parse(row.metadata);
                            geo.lat = meta.vendor_lat || null;
                            geo.lng = meta.vendor_lng || null;
                            geo.alt = meta.vendor_alt || null;
                            geo.location_note = meta.location_note || row.location || null;
                        } catch (e) {
                            // ignore parse errors
                        }
                    }
                    return { ...row, geo };
                })
                .filter((row) => row.geo.lat !== null && row.geo.lng !== null);
        } catch (err) {
            throw new Error(
                `Error in ${this.name}.getTransactionsWithGeoForVendor: ${err.message}`
            );
        }
    }

    /**
     * Get top locations by transaction count for a vendor
     */
    static async getTopLocationsForVendor(vendorId, limit = 3) {
        const sql = `
      SELECT 
        t.location,
        COUNT(1) AS transaction_count,
        SUM(t.amount_tokens) AS total_tokens
      FROM ${qident(this._tableName())} t
      WHERE t.vendor_id = ? AND t.status = 'completed' AND t.location IS NOT NULL AND t.location != ''
      GROUP BY t.location
      ORDER BY transaction_count DESC
      LIMIT ?
    `;
        try {
            return this._db().all(sql, [vendorId, limit]);
        } catch (err) {
            throw new Error(`Error in ${this.name}.getTopLocationsForVendor: ${err.message}`);
        }
    }

    /**
     * Get transactions for a specific user
     * options: { 
     *   limit=infinite, 
     *   offset=0, 
     *   status, 
     *   type,
     *   since (ISO string),
     *   until (ISO string),
     *   vendor_id,
     *   item_id,
     *   orderBy = 'timestamp',
     *   orderDir = 'DESC'  }
     */
    static async getTransactionByUserId(userId, options = {}) {
        const limit = Number.isFinite(Number(options.limit)) ? Number(options.limit) : 0;
        const offset = Number.isFinite(Number(options.offset)) ? Number(options.offset) : 0;
        const orderBy = options.orderBy || 'timestamp';
        const orderDir = (options.orderDir || 'DESC').toUpperCase();
        const params = [userId];

        let sql = `
        SELECT
            t.*,
            i.name AS item_name,
            i.price_tokens AS item_price,
            c.name AS item_category,
            v.name AS vendor_name,
            v.location AS vendor_location
        FROM ${qident(this._tableName())} t
        LEFT JOIN ${qident('Items')} i ON t.item_id = i.id
        LEFT JOIN ${qident('Categories')} c ON i.category_id = c.id
        LEFT JOIN ${qident('Vendors')} v ON t.vendor_id = v.id
        LEFT JOIN ${qident('Wallets')} w ON t.walletSource_id = w.id
        WHERE       (t.walletSource_id IN (SELECT id FROM Wallets WHERE user_id = ?)
                    OR
                    t.walletDestination_id IN (SELECT id FROM Wallets WHERE user_id = ?))`;
        params.push(userId);

        if (options.status) {
            sql += ` AND t.status = ?`;
            params.push(options.status);
        }
        
        if (options.type) {
            sql += ` AND t.type = ?`;
            params.push(options.type);
        }
        
        if (options.vendor_id) {
            sql += ` AND t.vendor_id = ?`;
            params.push(options.vendor_id);
        }
        
        if (options.item_id) {
            sql += ` AND t.item_id = ?`;
            params.push(options.item_id);
        }
        
        if (options.since) {
            sql += ` AND t.timestamp >= ?`;
            params.push(options.since);
        }
        
        if (options.until) {
            sql += ` AND t.timestamp <= ?`;
            params.push(options.until);
        }

        // Valideer orderBy om SQL injection te voorkomen
        const allowedOrderFields = ['timestamp', 'amount_tokens', 'status', 'type'];
        const safeOrderBy = allowedOrderFields.includes(orderBy) ? orderBy : 'timestamp';
        const safeOrderDir = orderDir === 'ASC' ? 'ASC' : 'DESC';
        
        if (limit > 0) {
            sql += ` ORDER BY t.${safeOrderBy} ${safeOrderDir} LIMIT ? OFFSET ?`;
            params.push(limit, offset);
        } else {
            sql += ` ORDER BY t.${safeOrderBy} ${safeOrderDir} LIMIT -1 OFFSET ?`;
            params.push(offset);
        }

        try {
            return this._db().all(sql, params);
        } catch (err) {
            throw new Error(`Error in ${this.name}.getByUserId: ${err.message}`);
        }
    }

}

module.exports = TransactionModel;
