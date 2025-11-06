const BaseModel = require('../../base/model');
const qident = require('../../utils/qident');

class TransactionItemModel extends BaseModel {
  static tableName = 'TransactionItems';

  static async createManyForTransaction(transactionId, lines = []) {
    if (!transactionId || !Array.isArray(lines) || lines.length === 0) return [];
    const stmt = this._db().prepare(
      `INSERT INTO ${qident(this._tableName())} (transaction_id, item_id, quantity, unit_price_tokens, created_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
    );
    const created = [];
    const tx = this._db().transaction((rows) => {
      for (const l of rows) {
        stmt.run(transactionId, l.item_id || null, Number(l.quantity) || 1, Number(l.unit_price_tokens) || 0);
      }
    });
    tx(lines);
    return this.getByTransactionId(transactionId);
  }

  static async getByTransactionId(transactionId) {
    const sql = `SELECT ti.*, i.name AS item_name
                 FROM ${qident(this._tableName())} ti
                 LEFT JOIN ${qident('Items')} i ON ti.item_id = i.id
                 WHERE ti.transaction_id = ?`;
    return this._db().all(sql, [transactionId]);
  }
}

module.exports = TransactionItemModel;


