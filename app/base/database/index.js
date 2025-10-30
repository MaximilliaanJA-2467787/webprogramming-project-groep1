// app/data/database/index.js
const SqliteDatabase = require('better-sqlite3');
const path = require('path');
const schema = require('../../data/schema');

class Database {
    /**
     * dbPath: path to file (e.g. './database.db')
     * options: passed to better-sqlite3 constructor
     */
    constructor(
        dbPath = path.join(__dirname, '../../../database.db'),
        options = { verbose: console.log }
    ) {
        this.sqlite = new SqliteDatabase(dbPath, options);

        // pragmatic SQLite pragmas for WAL mode and sensible settings
        this.sqlite.pragma('journal_mode = WAL');
        this.sqlite.pragma('busy_timeout = 5000');
        this.sqlite.pragma('synchronous = NORMAL');
        // cache_size expects integer pages — large positive number here is not recommended; keep moderate
        this.sqlite.pragma('cache_size = -2000'); // negative => KB, positive => pages (example)
        this.sqlite.pragma('foreign_keys = ON');
        this.sqlite.pragma('temp_store = MEMORY');

        // Initialize schema
        this.initDatabase();
    }

    run(sql, params = []) {
        if (Array.isArray(params)) {
            return this.sqlite.prepare(sql).run(...params);
        } else if (typeof params === 'object') {
            return this.sqlite.prepare(sql).run(params);
        }
        return this.sqlite.prepare(sql).run();
    }

    get(sql, params = []) {
        if (Array.isArray(params)) {
            return this.sqlite.prepare(sql).get(...params);
        } else if (typeof params === 'object') {
            return this.sqlite.prepare(sql).get(params);
        }
        return this.sqlite.prepare(sql).get();
    }

    all(sql, params = []) {
        if (Array.isArray(params)) {
            return this.sqlite.prepare(sql).all(...params);
        } else if (typeof params === 'object') {
            return this.sqlite.prepare(sql).all(params);
        }
        return this.sqlite.prepare(sql).all();
    }

    prepare(sql) {
        return this.sqlite.prepare(sql);
    }

    transaction(fn) {
        // return a function wrapped in better-sqlite3 transaction
        const wrapped = this.sqlite.transaction(fn);
        return (...args) => wrapped(...args);
    }

    async getAllTablesInfo() {
        const tablesInfo = {};

        const tableNames = this.all(
            `SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%';`
        );

        for (const row of tableNames) {
            const tableName = row.name;

            const columns = this.all(`PRAGMA table_info(${tableName});`);

            tablesInfo[tableName] = columns.map((col) => ({
                name: col.name,
                type: col.type,
                pk: col.pk === 1,
                notnull: col.notnull === 1,
                dflt_value: col.dflt_value,
            }));
        }

        return { tables: tablesInfo };
    }

    initDatabase() {
        // Build SQL for all tables and indices
        const createSqls = [];
        const indexSqls = [];

        for (const t of schema) {
            createSqls.push(t.toCreateSQL());
            indexSqls.push(...t.toIndexSQLs());
        }

        // Run creation in a transaction
        const runAll = this.transaction(() => {
            for (const s of createSqls) {
                this.sqlite.exec(s);
            }
            for (const s of indexSqls) {
                this.sqlite.exec(s);
            }
        });

        // execute
        try {
            runAll();
        } catch (err) {
            console.error('Failed to create tables/indexes:', err);
            throw err;
        }
    }
}

// single shared instance
const database = new Database();

module.exports = {
    databaseRef: database,
    sqlite: database.sqlite,
};
