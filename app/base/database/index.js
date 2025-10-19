const SqliteDatabase = require('better-sqlite3');
const config = require('../../config');
let sqlite = null;

class Database {
    constructor() {
        sqlite = new SqliteDatabase('database.db', { verbose: console.log });

        sqlite.pragma('journal_mode = WAL;');
        sqlite.pragma('busy_timeout = 5000;');
        sqlite.pragma('synchronous = NORMAL;');
        sqlite.pragma('cache_size = 1000000000;');
        sqlite.pragma('foreign_keys = true;');
        sqlite.pragma('temp_store = memory;');
    }
}

const database = new Database();
module.exports = {
    sqlite: sqlite,
    database: database,
};
