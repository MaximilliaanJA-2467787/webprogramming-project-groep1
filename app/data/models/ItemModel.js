const BaseModel = require('../../base/model');
const qident = require('../../utils/qident');

/**
 * ItemModel - represents menu items
 * Table: Items
 */
class ItemModel extends BaseModel {
    static tableName = 'Items';

    /**
     * Get menu items for a vendor
     * options: { limit, offset, orderBy, orderDirection }
     */
    static async getMenuItems(vendorId, options = {}) {
        const table = qident(this._tableName());
        const params = [vendorId];
        let sql = `
      SELECT i.*,
             c.name as category_name
      FROM ${table} i
      LEFT JOIN ${qident('Categories')} c ON i.category_id = c.id
      WHERE i.vendor_id = ?
    `;

        if (options.orderBy) {
            const orderBy = Array.isArray(options.orderBy)
                ? options.orderBy.map((c) => qident(c)).join(', ')
                : qident(options.orderBy);
            sql += ` ORDER BY ${orderBy} ${(options.orderDirection || 'ASC').toUpperCase()}`;
        }

        if (options.limit !== undefined) {
            sql += ` LIMIT ${Number(options.limit)}`;
            if (options.offset !== undefined) {
                sql += ` OFFSET ${Number(options.offset)}`;
            }
        }

        try {
            return this._db().all(sql, params);
        } catch (err) {
            throw new Error(`Error in ${this.name}.getMenuItems: ${err.message}`);
        }
    }

    /**
     * Create a new item for a vendor
     * data: { name, category_id, price_tokens, metadata }
     */
    static async createForVendor(vendorId, data = {}) {
        const payload = Object.assign({}, data, { vendor_id: vendorId });
        return this.create(payload);
    }

    /**
     * Increment popularity_count by amount (default 1)
     */
    static async incrementPopularity(itemId, amount = 1) {
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new Error('amount must be a positive number');
        }
        const sql = `UPDATE ${qident(this._tableName())} SET popularity_count = popularity_count + ? WHERE id = ?`;
        try {
            const info = this._db().run(sql, [amount, itemId]);
            if (!info || info.changes === 0) return null;
            return this.getById(itemId);
        } catch (err) {
            throw new Error(`Error in ${this.name}.incrementPopularity: ${err.message}`);
        }
    }

    /**
     * Get a single item with category name
     */
    static async getByIdWithCategory(id) {
        const sql = `
      SELECT i.*, c.name as category_name
      FROM ${qident(this._tableName())} i
      LEFT JOIN ${qident('Categories')} c ON i.category_id = c.id
      WHERE i.id = ?
    `;
        try {
            const row = this._db().get(sql, [id]);
            return row || null;
        } catch (err) {
            throw new Error(`Error in ${this.name}.getByIdWithCategory: ${err.message}`);
        }
    }
}

module.exports = ItemModel;
