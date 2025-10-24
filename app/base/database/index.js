const SqliteDatabase = require('better-sqlite3');
const TableBuilderModule = require('../database/tablebuilder')
const TableBuilder = TableBuilderModule.TableBuilder;
let sqlite = new SqliteDatabase('database.db', { verbose: console.log });

class Database {
    constructor() {
        sqlite.pragma('journal_mode = WAL;');
        sqlite.pragma('busy_timeout = 5000;');
        sqlite.pragma('synchronous = NORMAL;');
        sqlite.pragma('cache_size = 1000000000;');
        sqlite.pragma('foreign_keys = true;');
        sqlite.pragma('temp_store = memory;');

        this.initDatabase();
    };

    initDatabase() {
        // User database
        const userTable = new TableBuilder('Users');
        TableBuilderModule.CommonColumns.id(userTable);
        TableBuilderModule.CommonColumns.uuid(userTable, true);
        userTable.col('email').tekst().unique().notNull();
        userTable.col('password').tekst().notNull().unique();
        userTable.col('name').tekst().notNull();
        userTable.col('role').tekst().notNull();
        TableBuilderModule.CommonColumns.createdAt(userTable);

        // Wallets
        const walletTable = new TableBuilder('Wallets')
        TableBuilderModule.CommonColumns.id(walletTable);
        walletTable.col('balance_tokens').real();
        walletTable.col('currency').tekst();
        TableBuilderModule.CommonColumns.createdAt(walletTable);
        walletTable.fk('user_id','Users', 'id', {onDelete: 'CASCADE', onUpdate: 'CASCADE'});

        // Categories
        const categoriesTable = new TableBuilder('categories');
        TableBuilderModule.CommonColumns.id(categoriesTable);
        categoriesTable.col('name').tekst().notNull();

        // Vendors
        const vendorTable = new TableBuilder('vendors');
        TableBuilderModule.CommonColumns.id(vendorTable);
        categoriesTable.col('name').tekst().notNull();
        categoriesTable.col('Longitude').real();
        categoriesTable.col('Latitude').real();

        // Items
        const itemTable = new TableBuilder('items');
        

        // Transactions
        const transactionTable = new TableBuilder('Transactions');
        TableBuilderModule.CommonColumns.id(transactionTable);
        transactionTable.col('type').tekst().notNull();
        transactionTable.col('amount_tokens').integer().notNull();
        transactionTable.col('location').tekst();
        transactionTable.col('timestamp').datetime().default('CURRENT_TIMESTAMP');
        transactionTable.col('metadata').tekst();
        
        transactionTable.fk('walletSource_id', 'Wallets', 'id', {onDelete: 'SET NULL'});
        transactionTable.fk('walletDestination_id', 'Wallets', 'id', {onDelete: 'SET NULL'});
        // transactionTable.fk('item_id', '')
    };

    run(sql, params = []) {

    }
}

const database = new Database();
module.exports = {
    sqlite: sqlite,
    databaseRef: database,
};

/**
 * Tablebuilder.js -> all classes seperate file/module
 * CommonCollumns -> for each function in CommonCollumns -> make member function of tablebuilder
 * TableBuilder class implementation so it actually manipulates the DB
 */



class DataBase {
    constructor() {

    }



}

class Table {

    constructor() {
        this.columns = [];
    }

    static Builder = class Builder {
        constructor() {
            this.table = new Table();
        }

        static col(name) {
            // this.table.columns.push(new Col(name));
        }

        static build() {
            return this.table;
        }
    }

}

