// app/data/database/TableBuilder.js
const qident = require('../../utils/qident');

/**
 * ColumnBuilder: build single column metadata and SQL
 */
class ColumnBuilder {
    constructor(name) {
        if (!name) throw new Error('Column requires a name');
        this._name = name;
        this._type = 'TEXT';
        this._constraints = [];
        this._default = undefined;
        this._references = null; // { table, column, opts }
    }

    // datatypes
    integer() {
        this._type = 'INTEGER';
        return this;
    }
    real() {
        this._type = 'REAL';
        return this;
    }
    text() {
        this._type = 'TEXT';
        return this;
    }
    datetime() {
        this._type = 'DATETIME';
        return this;
    }

    // constraints
    notNull() {
        this._constraints.push('NOT NULL');
        return this;
    }
    unique() {
        this._constraints.push('UNIQUE');
        return this;
    }
    primaryKey() {
        this._constraints.push('PRIMARY KEY');
        return this;
    }
    autoincrement() {
        if (this._type !== 'INTEGER') {
            console.warn(`AUTOINCREMENT only works with INTEGER column '${this._name}'`);
            return this;
        }
        this._constraints.push('AUTOINCREMENT');
        return this;
    }
    default(val) {
        this._default = val;
        return this;
    }
    check(expr) {
        this._constraints.push(`CHECK(${expr})`);
        return this;
    }
    collate(collation) {
        this._constraints.push(`COLLATE ${collation}`);
        return this;
    }

    // inline FK
    references(table, column, opts = {}) {
        this._references = { table, column, opts };
        return this;
    }

    toSQL() {
        let parts = [qident(this._name), this._type];
        parts = parts.concat(this._constraints);

        if (this._default !== undefined) {
            let defaultValue;

            if (
                typeof this._default === 'string' &&
                (this._default.includes('(') || this._default === 'CURRENT_TIMESTAMP')
            ) {
                defaultValue = this._default;
            } else if (typeof this._default === 'string') {
                defaultValue = `'${this._default.replace(/'/g, "''")}'`;
            } else if (typeof this._default === 'boolean') {
                defaultValue = this._default ? '1' : '0';
            } else if (this._default === null) {
                defaultValue = 'NULL';
            } else if (typeof this._default === 'object') {
                const j = JSON.stringify(this._default);
                defaultValue = `'${j.replace(/'/g, "''")}'`;
            } else {
                defaultValue = String(this._default);
            }

            parts.push('DEFAULT ' + defaultValue);
        }

        if (this._references) {
            const { table, column, opts } = this._references;
            let foreignKeySQL = `REFERENCES ${qident(table)}(${qident(column)})`;
            if (opts.onDelete) foreignKeySQL += ` ON DELETE ${opts.onDelete}`;
            if (opts.onUpdate) foreignKeySQL += ` ON UPDATE ${opts.onUpdate}`;
            parts.push(foreignKeySQL);
        }

        return parts.join(' ');
    }
}

/**
 * TableBuilder: collects columns, keys, indices and produces SQL
 */
class TableBuilder {
    constructor(name) {
        if (!name) throw new Error('TableBuilder requires a name');
        this.name = name;
        this.columns = [];
        this._fk = [];
        this._indices = [];
        this._unique = [];
        this._withoutRowid = false;
        this._ifNotExists = true;
    }

    col(name) {
        const c = new ColumnBuilder(name);
        this.columns.push(c);
        return c;
    }

    fk(localCol, refTable, refCol, opts = {}) {
        if (!localCol || !refTable || !refCol)
            throw new Error('Foreign key requires localCol, refTable, and refCol');
        this._fk.push({ localCol, refTable, refCol, opts });
        return this;
    }

    index(columns, opts = {}) {
        const columnArray = Array.isArray(columns) ? columns : [columns];
        this._indices.push({ columns: columnArray, opts });
        return this;
    }

    unique(columns, constraintName = null) {
        const columnArray = Array.isArray(columns) ? columns : [columns];
        this._unique.push({ columns: columnArray, name: constraintName });
        return this;
    }

    ifNotExists(value = true) {
        this._ifNotExists = value;
        return this;
    }
    withoutRowid(value = true) {
        this._withoutRowid = value;
        return this;
    }

    check(expr, name = null) {
        const checkSql = name ? `CONSTRAINT ${qident(name)} CHECK(${expr})` : `CHECK(${expr})`;
        this._fk.push({ isCheck: true, sql: checkSql });
        return this;
    }

    toCreateSQL() {
        const colsSql = this.columns.map((c) => c.toSQL());
        const fkSql = this._fk.map((fk) => {
            if (fk.isCheck) return fk.sql;
            let x = `FOREIGN KEY(${qident(fk.localCol)}) REFERENCES ${qident(fk.refTable)}(${qident(fk.refCol)})`;
            if (fk.opts.onDelete) x += ` ON DELETE ${fk.opts.onDelete}`;
            if (fk.opts.onUpdate) x += ` ON UPDATE ${fk.opts.onUpdate}`;
            return x;
        });

        const uniqueSql = this._unique.map((u) => {
            const cols = u.columns.map((c) => qident(c)).join(', ');
            return u.name ? `CONSTRAINT ${qident(u.name)} UNIQUE(${cols})` : `UNIQUE(${cols})`;
        });

        const all = [...colsSql, ...fkSql, ...uniqueSql];
        const ifNotExists = this._ifNotExists ? 'IF NOT EXISTS ' : '';
        const without = this._withoutRowid ? ' WITHOUT ROWID' : '';

        return `CREATE TABLE ${ifNotExists}${qident(this.name)} (\n  ${all.join(',\n  ')}\n)${without};`;
    }

    toIndexSQLs() {
        return this._indices.map((idx) => {
            const indexName =
                idx.opts.name ||
                `idx_${this.name}_${idx.columns.map((c) => (typeof c === 'object' ? c.column : c)).join('_')}`;
            const unique = idx.opts.unique ? 'UNIQUE ' : '';
            const cols = idx.columns
                .map((c) => {
                    if (typeof c === 'object') return `${qident(c.column)} ${c.order || 'ASC'}`;
                    return qident(c);
                })
                .join(', ');
            const where = idx.opts.where ? ` WHERE ${idx.opts.where}` : '';
            const ifNotExists = this._ifNotExists ? 'IF NOT EXISTS ' : '';
            return `CREATE ${unique}INDEX ${ifNotExists}${qident(indexName)} ON ${qident(this.name)} (${cols})${where};`;
        });
    }

    toDropSQL() {
        const ifExists = this._ifNotExists ? 'IF EXISTS ' : '';
        return `DROP TABLE ${ifExists}${qident(this.name)};`;
    }

    toAlterSQL() {
        return {
            addColumn: (columnBuilder) =>
                `ALTER TABLE ${qident(this.name)} ADD COLUMN ${columnBuilder.toSQL()};`,
            renameTable: (newName) =>
                `ALTER TABLE ${qident(this.name)} RENAME TO ${qident(newName)};`,
            renameColumn: (oldName, newName) =>
                `ALTER TABLE ${qident(this.name)} RENAME COLUMN ${qident(oldName)} TO ${qident(newName)};`,
            // Note: DROP COLUMN is supported only on newer SQLite versions and not always portable
            dropColumn: (columnName) =>
                `ALTER TABLE ${qident(this.name)} DROP COLUMN ${qident(columnName)};`,
        };
    }
}

// Factory
function Table(name) {
    return new TableBuilder(name);
}

// Common column helpers
const CommonColumns = {
    id(builder) {
        return builder.col('id').integer().primaryKey().autoincrement();
    },
    uuid(builder, unique = true) {
        const col = builder.col('uuid').text().notNull();
        return unique ? col.unique() : col;
    },
    createdAt(builder) {
        builder.col('created_at').datetime().default('CURRENT_TIMESTAMP');
        return builder;
    },
    softDelete(builder) {
        builder.col('deleted_at').datetime();
        return builder;
    },
};

module.exports = {
    TableBuilder,
    Table,
    ColumnBuilder,
    CommonColumns,
};
