const SqliteDatabase = require('better-sqlite3');
const config = require('../../config');
const TableBuilder = require('../database/tablebuilder')
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

        this.initDatabase();
    };

    initDatabase() {
        // User database
        const userTable = Table('Users');
        TableBuilder.CommonColumns.id(userTable);
        TableBuilder.CommonColumns.uuid(userTable, true);
        userTable.col('email').tekst().unique().notNull();
        userTable.col('password').tekst().notNull().unique();
        userTable.col('name').tekst().notNull();
        userTable.col('role').tekst().notNull();
        TableBuilder.CommonColumns.createdAt(userTable);

        // Wallets
        const walletTable = Table('Wallets')
        TableBuilder.CommonColumns.id(walletTable);
        walletTable.col('balance_tokens').real();
        walletTable.col('currency').tekst();
        TableBuilder.CommonColumns.createdAt(walletTable);
        walletTable.fk('user_id','Users', 'id', {onDelete: 'CASCADE', onUpdate: 'CASCADE'});

        // Categories
        const categoriesTable = Tabel('categories');
        TableBuilder.CommonColumns.id(categoriesTable);
        categoriesTable.col('name').tekst().notNull();

        // Vendors
        const vendorTable = Table('vendors');
        TableBuilder.CommonColumns.id(vendorTable);
        categoriesTable.col('name').tekst().notNull();
        categoriesTable.col('Longitude').real();
        categoriesTable.col('Latitude').real();

        // Items
        const itemTable = Table('items');
        

        // Transactions
        const transactionTable = Table('Transactions');
        TableBuilder.CommonColumns.id(transactionTable);
        transactionTable.col('type').tekst().notNull();
        transactionTable.col('amount_tokens').integer().notNull();
        transactionTable.col('location').tekst();
        transactionTable.col('timestamp').datetime().default('CURRENT_TIMESTAMP');
        transactionTable.col('metadata').text();
        
        transactionTable.fk('walletSource_id', 'Wallets', 'id', {onDelete: 'SET NULL'});
        transactionTable.fk('walletDestination_id', 'Wallets', 'id', {onDelete: 'SET NULL'});
        transactionTable.fk('item_id', '')
    };

    run(sql, params = []) {

    }
}

const database = new Database();
module.exports = {
    sqlite: sqlite,
    databaseRef: database,
};
