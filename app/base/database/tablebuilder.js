// app/data/database/TableBuilder.js
const assert = require('assert');
const qident = require('../../utils/qident');

const database = require("./index").databaseRef;

database.run();

class ColumnBuilder {
    constructor(name) {
        this._name = name;
        this._type = 'TEXT';
        this._constraints = [];
        this._default = undefined;
        this._references = null;
    }

    // Datatypes

    integer() {
        this._type = 'INTEGER';
        return this;
    }
    /**
     * zelfde als float(24)
     */
    real() {
        this._type = 'REAL';
        return this;
    }
    tekst() {
        this._type = 'TEXT';
        return this;
    }
    datetime() {
        this._type = 'DATETIME';
        return this;
    }

    // Constraints

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
            console.warn(
                `Warning: AUTOINCREMENT werkt alleen met INTEGER type voor kolom '${this._name}. AUTOINCREMENT wordt niet gezet!'`
            );
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
    // voor inline FK
    references(table, column, opts = {}) {
        this._references = { table, column, opts };
        return this;
    }
    collate(collation) {
        this._constraints.push(`COLLATE ${collation}`);
        return this;
    }

    /**
     * maakt SQL voor kolom aan
     */
    toSQL() {
        // start met type een naam
        let parts = [qident(this._name), this._type];

        // Voeg constraints toe
        parts = parts.concat(this._constraints);

        // Voegt default waarde toe, als die er zijn
        if (this._default !== undefined) {
            let defaultValue;

            if (
                typeof this._default === 'string' &&
                (this._default.includes('(') || this._default === 'CURRENT_TIMESTAMP')
            ) {
                defaultValue = this._default;
            } else {
                defaultValue = JSON.stringify(this._default);
            }

            parts.push('DEFAULT ' + defaultValue);
        }

        // inline FK
        if (this._references) {
            const { table, column, opts } = this._references;
            let foreignKeySQL = `REFERENCES ${qident(table)}(${qident(column)})`;

            // onDelete en onUpdate opties toevoegen als aanwezig
            if (opts.onDelete) {
                foreignKeySQL += ` ON DELETE ${opts.onDelete}`;
            }
            if (opts.onUpdate) {
                foreignKeySQL += ` ON UPDATE ${opts.onUpdate}`;
            }

            parts.push(foreignKeySQL);
        }

        return parts.join(' ');
    }
}

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

    //Voegt kolom toe
    col(name) {
        const c = new ColumnBuilder(name);
        this.columns.push(c);
        return c;
    }

    // Voeg een foreign key constraint toe
    fk(localCol, refTable, refCol, opts = {}) {
        if (!localCol || !refTable || !refCol) {
            throw new Error('Foreign key requires localCol, refTable, and refCol');
        }
        this._fk.push({ localCol, refTable, refCol, opts });
        return this;
    }

    /**
     * Voegt index toe
     * columns kan een string of array zijn
     */
    index(columns, opts = {}) {
        const columnArray = Array.isArray(columns) ? columns : [columns];
        this._indices.push({ columns: columnArray, opts });
        return this;
    }

    // unique constraints op meerdere columns
    unique(columns, constraintName = null) {
        const columnArray = Array.isArray(columns) ? columns : [columns];
        this._unique.push({ columns: columnArray, name: constraintName });
        return this;
    }

    // Toggle IF NOT EXISTS
    ifNotExists(value = true) {
        this._ifNotExists = value;
        return this;
    }

    /// Check constraint, tabel niveau
    check(expr, name = null) {
        const checkSql = name ? `CONSTRAINT ${qident(name)} CHECK(${expr})` : `CHECK(${expr})`;
        this._fk.push({ isCheck: true, sql: checkSql });
        return this;
    }

    // Generate CREATE TABLE SQL
    toCreateSQL() {
        // def kolom
        const colsSql = this.columns.map((c) => c.toSQL());

        // FK constraints
        const fkSql = this._fk.map((fk) => {
            // CHECK constraints
            if (fk.isCheck) {
                return fk.sql;
            }

            let x = `FOREIGN KEY(${qident(fk.localCol)}) REFERENCES ${qident(fk.refTable)}(${qident(fk.refCol)})`;

            if (fk.opts.onDelete) {
                x += ` ON DELETE ${fk.opts.onDelete}`;
            }

            if (fk.opts.onUpdate) {
                x += ` ON UPDATE ${fk.opts.onUpdate}`;
            }

            return x;
        });

        // UNIQUE constraints
        const uniqueSql = this._unique.map((u) => {
            const cols = u.columns.map((c) => qident(c)).join(', ');
            return u.name ? `CONSTRAINT ${qident(u.name)} UNIQUE(${cols})` : `UNIQUE(${cols})`;
        });

        // Combineer alles
        const all = [...colsSql, ...fkSql, ...uniqueSql];

        // Formatting
        const ifNotExists = this._ifNotExists ? 'IF NOT EXISTS ' : '';
        const without = this._withoutRowid ? ' WITHOUT ROWID' : '';

        return `CREATE TABLE ${ifNotExists}${qident(this.name)} (\n  ${all.join(',\n  ')}\n);`;
    }

    // Maakt CREATE INDEX statements
    toIndexSQLs() {
        return this._indices.map((idx) => {
            // Genereer index naam als niet opgegeven
            const indexName = idx.opts.name || `idx_${this.name}_${idx.columns.join('_')}`;
            const unique = idx.opts.unique ? 'UNIQUE ' : '';

            // support voor DESC/ASC per kolom
            const cols = idx.columns
                .map((c) => {
                    if (typeof c === 'object') {
                        // Support voor { column: 'name', order: 'DESC' }
                        return `${qident(c.column)} ${c.order || 'ASC'}`;
                    }
                    return qident(c);
                })
                .join(', ');

            // WHERE clause support
            const where = idx.opts.where ? ` WHERE ${idx.opts.where}` : '';

            const ifNotExists = this._ifNotExists ? 'IF NOT EXISTS ' : '';

            return `CREATE ${unique}INDEX ${ifNotExists}${qident(indexName)} ON ${qident(this.name)} (${cols})${where};`;
        });
    }

    // DROP TABLE statement
    toDropSQL() {
        const ifExists = this._ifNotExists ? 'IF EXISTS ' : '';
        return `DROP TABLE ${ifExists}${qident(this.name)};`;
    }

    // ALTER TABLE statements
    toAlterSQL() {
        return {
            addColumn: (columnBuilder) => {
                return `ALTER TABLE ${qident(this.name)} ADD COLUMN ${columnBuilder.toSQL()};`;
            },
            renameTable: (newName) => {
                return `ALTER TABLE ${qident(this.name)} RENAME TO ${qident(newName)};`;
            },
            renameColumn: (oldName, newName) => {
                return `ALTER TABLE ${qident(this.name)} RENAME COLUMN ${qident(oldName)} TO ${qident(newName)};`;
            },
            dropColumn: (columnName) => {
                return `ALTER TABLE ${qident(this.name)} DROP COLUMN ${qident(columnName)};`;
            },
        };
    }
}

// Factory function voor TableBuilder
function Table(name) {
    return new TableBuilder(name);
}

// Helper functie voor veelgebruikte column patronen
const CommonColumns = {
    id(builder) {
        return builder.col('id').integer().primaryKey().autoincrement();
    },

    uuid(builder, unique = true) {
        const col = builder.col('uuid').tekst().notNull();
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
    Table,
    TableBuilder,
    ColumnBuilder,
    CommonColumns,
};
