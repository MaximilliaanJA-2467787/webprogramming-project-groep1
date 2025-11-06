const { Table, CommonColumns } = require('../base/database/tablebuilder');

/**
 * Tables:
 * - Users
 * - Wallets
 * - Categories
 * - Vendors
 * - Items
 * - Transactions
 * - GroupPots
 * - GroupRepayments
 * - UserGroup (membership)
 * - Budgets
 * - BudgetAlerts
 * - Notifications
 *
 * Each table declares local FK columns before the table-level FOREIGN KEY() constraints.
 */

//
// Users
//
const Users = Table('Users');
CommonColumns.id(Users);
CommonColumns.uuid(Users, true); // unique uuid
Users.col('email').text().unique().notNull();
Users.col('password_hash').text().notNull();
Users.col('name').text().notNull();
Users.col('role').text().notNull(); // user / vendor / admin
CommonColumns.createdAt(Users);
Users.index(['email'], { name: 'idx_users_email' });

//
// Wallets
//
const Wallets = Table('Wallets');
CommonColumns.id(Wallets);
Wallets.col('user_id').integer().notNull();
Wallets.col('balance_tokens').real().default(0);
Wallets.col('currency').text().default('EUR');
CommonColumns.createdAt(Wallets);
Wallets.fk('user_id', 'Users', 'id', { onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Wallets.index(['user_id'], { name: 'idx_wallets_user' });

//
// Categories
//
const Categories = Table('Categories');
CommonColumns.id(Categories);
Categories.col('name').text().notNull().unique();
Categories.index(['name'], { name: 'idx_categories_name' });

//
// Vendors
//
const Vendors = Table('Vendors');
CommonColumns.id(Vendors);
Vendors.col('user_id').integer(); // the account that represents this vendor (optional)
Vendors.col('name').text().notNull();
Vendors.col('location').text(); // freeform location string, can be lat/lon JSON
Vendors.col('longitude').real();
Vendors.col('latitude').real();
CommonColumns.createdAt(Vendors);
Vendors.fk('user_id', 'Users', 'id', { onDelete: 'SET NULL' });
Vendors.index(['user_id'], { name: 'idx_vendors_user' });
Vendors.index(['name'], { name: 'idx_vendors_name' });

//
// Items
//
const Items = Table('Items');
CommonColumns.id(Items);
Items.col('vendor_id').integer();
Items.col('name').text().notNull();
Items.col('category_id').integer();
Items.col('price_tokens').integer().default(0);
Items.col('popularity_count').integer().default(0);
Items.col('metadata').text(); // JSON as TEXT
CommonColumns.createdAt(Items);
Items.fk('vendor_id', 'Vendors', 'id', { onDelete: 'SET NULL' });
Items.fk('category_id', 'Categories', 'id', { onDelete: 'SET NULL' });
Items.index(['vendor_id'], { name: 'idx_items_vendor' });
Items.index(['category_id'], { name: 'idx_items_category' });

//
// Transactions
//
const Transactions = Table('Transactions');
CommonColumns.id(Transactions);
Transactions.col('uuid').text().notNull().unique(); // external matching id for pay requests
Transactions.col('walletSource_id').integer(); // nullable: deposits may have null source
Transactions.col('walletDestination_id').integer(); // nullable
Transactions.col('type').text().notNull(); // purchase/deposit/withdraw/repay
Transactions.col('amount_tokens').real().notNull();
Transactions.col('item_id').integer();
Transactions.col('vendor_id').integer();
Transactions.col('location').text();
Transactions.col('timestamp').datetime().default('CURRENT_TIMESTAMP');
Transactions.col('metadata').text(); // JSON as TEXT
Transactions.col('status').text().default('pending'); // pending/completed/canceled/busy
CommonColumns.createdAt(Transactions);

// foreign keys (local columns exist above)
Transactions.fk('walletSource_id', 'Wallets', 'id', { onDelete: 'SET NULL' });
Transactions.fk('walletDestination_id', 'Wallets', 'id', { onDelete: 'SET NULL' });
Transactions.fk('item_id', 'Items', 'id', { onDelete: 'SET NULL' });
Transactions.fk('vendor_id', 'Vendors', 'id', { onDelete: 'SET NULL' });

Transactions.index(['walletSource_id'], { name: 'idx_tx_wallet_source' });
Transactions.index(['walletDestination_id'], { name: 'idx_tx_wallet_dest' });
Transactions.index(['vendor_id'], { name: 'idx_tx_vendor' });
Transactions.index(['timestamp'], { name: 'idx_tx_timestamp' });

//
// Group pots (shared pools)
//
const GroupPots = Table('GroupPots');
CommonColumns.id(GroupPots);
GroupPots.col('name').text().notNull();
GroupPots.col('owner_id').integer().notNull(); // user who created/owns the pot
GroupPots.col('description').text();
GroupPots.col('metadata').text();
CommonColumns.createdAt(GroupPots);
GroupPots.fk('owner_id', 'Users', 'id', { onDelete: 'CASCADE' });
GroupPots.index(['owner_id'], { name: 'idx_grouppots_owner' });

//
// Group repayments (tracks who should repay whom)
//
const GroupRepayments = Table('GroupRepayments');
CommonColumns.id(GroupRepayments);
GroupRepayments.col('user_id').integer().notNull(); // who owes
GroupRepayments.col('group_pot_id').integer().notNull();
GroupRepayments.col('transaction_id').integer().notNull(); // the original transaction that caused the debt/share
GroupRepayments.col('share_percent').real().notNull(); // percent share (0-100)
GroupRepayments.col('amount_tokens').real().notNull(); // calculated amount to repay
GroupRepayments.col('status').text().default('open'); // open/paid/waived
CommonColumns.createdAt(GroupRepayments);

GroupRepayments.fk('user_id', 'Users', 'id', { onDelete: 'CASCADE' });
GroupRepayments.fk('group_pot_id', 'GroupPots', 'id', { onDelete: 'CASCADE' });
GroupRepayments.fk('transaction_id', 'Transactions', 'id', { onDelete: 'CASCADE' });
GroupRepayments.index(['group_pot_id'], { name: 'idx_grouprep_group' });
GroupRepayments.index(['user_id'], { name: 'idx_grouprep_user' });

//
// UserGroup (membership + invite/auth token)
//
const UserGroup = Table('UserGroup');
CommonColumns.id(UserGroup);
UserGroup.col('user_id').integer().notNull();
UserGroup.col('group_pot_id').integer().notNull();
UserGroup.col('role').text().default('member'); // member/admin
UserGroup.col('group_auth_token_hash').text(); // hashed token for invite/authorization
CommonColumns.createdAt(UserGroup);

// unique membership per user/group
UserGroup.unique(['user_id', 'group_pot_id'], 'uq_usergroup_user_group');

UserGroup.fk('user_id', 'Users', 'id', { onDelete: 'CASCADE' });
UserGroup.fk('group_pot_id', 'GroupPots', 'id', { onDelete: 'CASCADE' });
UserGroup.index(['group_pot_id'], { name: 'idx_usergroup_group' });
UserGroup.index(['user_id'], { name: 'idx_usergroup_user' });

//
// Budgets (per user per category)
//
const Budgets = Table('Budgets');
CommonColumns.id(Budgets);
Budgets.col('user_id').integer().notNull();
Budgets.col('category_id').integer().notNull();
Budgets.col('limit_tokens').real().notNull();
Budgets.col('interval').text().default('monthly'); // daily/weekly/monthly
Budgets.col('metadata').text();
CommonColumns.createdAt(Budgets);

Budgets.fk('user_id', 'Users', 'id', { onDelete: 'CASCADE' });
Budgets.fk('category_id', 'Categories', 'id', { onDelete: 'SET NULL' });
Budgets.index(['user_id'], { name: 'idx_budgets_user' });
Budgets.index(['category_id'], { name: 'idx_budgets_category' });

//
// Budget Alerts
//
const BudgetAlerts = Table('BudgetAlerts');
CommonColumns.id(BudgetAlerts);
BudgetAlerts.col('budget_id').integer().notNull();
BudgetAlerts.col('alert_threshold_percent').integer().notNull(); // e.g. 80
BudgetAlerts.col('message').text();
BudgetAlerts.col('active').integer().default(1); // 1 = enabled, 0 = disabled
CommonColumns.createdAt(BudgetAlerts);

BudgetAlerts.fk('budget_id', 'Budgets', 'id', { onDelete: 'CASCADE' });
BudgetAlerts.index(['budget_id'], { name: 'idx_budgetalerts_budget' });

//
// Notifications
//
const Notifications = Table('Notifications');
CommonColumns.id(Notifications);
Notifications.col('user_id').integer().notNull();
Notifications.col('type').text().notNull();
Notifications.col('payload').text(); // JSON as TEXT
Notifications.col('read').integer().default(0);
CommonColumns.createdAt(Notifications);

Notifications.fk('user_id', 'Users', 'id', { onDelete: 'CASCADE' });
Notifications.index(['user_id'], { name: 'idx_notifications_user' });
Notifications.index(['read'], { name: 'idx_notifications_read' });

// Export schema in the order that respects FK dependencies as much as possible.
// (Tables referencing others should appear after the referenced table.)
module.exports = [
    Users,
    Wallets,
    Categories,
    Vendors,
    Items,
    Transactions,
    // New: per-transaction items for multi-item orders
    (function(){
        const TransactionItems = Table('TransactionItems');
        CommonColumns.id(TransactionItems);
        TransactionItems.col('transaction_id').integer().notNull();
        TransactionItems.col('item_id').integer();
        TransactionItems.col('quantity').integer().notNull().default(1);
        TransactionItems.col('unit_price_tokens').integer().notNull().default(0);
        CommonColumns.createdAt(TransactionItems);
        TransactionItems.fk('transaction_id', 'Transactions', 'id', { onDelete: 'CASCADE' });
        TransactionItems.fk('item_id', 'Items', 'id', { onDelete: 'SET NULL' });
        TransactionItems.index(['transaction_id'], { name: 'idx_txitems_tx' });
        TransactionItems.index(['item_id'], { name: 'idx_txitems_item' });
        return TransactionItems;
    })(),
    GroupPots,
    GroupRepayments,
    UserGroup,
    Budgets,
    BudgetAlerts,
    Notifications,
];

// --- Seeding helpers ---
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
}

/**
 * Seed database with demo data. Call manually from a setup script:
 *   const { databaseRef } = require('../base/database');
 *   const schema = require('../data/schema');
 *   await schema.seed(databaseRef);
 */
module.exports.seed = async function seed(databaseRef) {
    if (!databaseRef || typeof databaseRef.run !== 'function') {
        throw new Error('seed(databaseRef) requires a databaseRef with .run/.get/.all');
    }

    const existing = databaseRef.get('SELECT COUNT(1) as cnt FROM Users');
    if (existing && existing.cnt >= 5) {
        return { skipped: true, reason: 'Users already present' };
    }

    const SALT_ROUNDS = 10;

    const tx = databaseRef.transaction(() => {
        // Categories
        const categories = ['Drinks', 'Food', 'Snacks', 'Desserts', 'Specials'];
        const catStmt = databaseRef.prepare('INSERT OR IGNORE INTO Categories (name) VALUES (?)');
        categories.forEach((c) => catStmt.run(c));

        // Users (1 admin, 2 vendors, 2 users)
        const users = [
            { email: 'admin@example.com', name: 'Admin One', role: 'admin' },
            { email: 'vendor1@example.com', name: 'Vendor One', role: 'vendor' },
            { email: 'vendor2@example.com', name: 'Vendor Two', role: 'vendor' },
            { email: 'user1@example.com', name: 'User One', role: 'user' },
            { email: 'user2@example.com', name: 'User Two', role: 'user' },
        ];
        const passwordHash = bcrypt.hashSync('Password123!', SALT_ROUNDS);
        const userStmt = databaseRef.prepare(
            'INSERT INTO Users (uuid, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
        );

        const insertedUsers = users.map((u) => {
            userStmt.run(uuidv4(), u.email, passwordHash, u.name, u.role);
            return databaseRef.get('SELECT id, email, role, name FROM Users WHERE email = ?', [u.email]);
        });

        // Wallets for each user
        const walletStmt = databaseRef.prepare(
            'INSERT INTO Wallets (user_id, balance_tokens, currency, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
        );
        const userIdToWallet = new Map();
        insertedUsers.forEach((u) => {
            // Give vendor and users some starting balance
            const startBal = u.role === 'admin' ? 0 : (u.role === 'vendor' ? 0 : 1000);
            walletStmt.run(u.id, startBal, 'TOK');
            const w = databaseRef.get('SELECT id, balance_tokens FROM Wallets WHERE user_id = ?', [u.id]);
            userIdToWallet.set(u.id, w);
        });

        // Vendors linked to vendor users
        const vendorUsers = insertedUsers.filter((u) => u.role === 'vendor');
        const vendorStmt = databaseRef.prepare(
            'INSERT INTO Vendors (user_id, name, location, longitude, latitude, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
        );
        const insertedVendors = vendorUsers.map((vu, i) => {
            const name = i === 0 ? 'Coffee Corner' : 'Burger Shack';
            const loc = i === 0 ? 'Hall A' : 'Food Court';
            vendorStmt.run(vu.id, name, loc, 4.4 + i * 0.01, 50.8 + i * 0.01);
            return databaseRef.get('SELECT id, name, user_id FROM Vendors WHERE user_id = ?', [vu.id]);
        });

        // Items: 10 unique per vendor
        const itemStmt = databaseRef.prepare(
            'INSERT INTO Items (vendor_id, name, category_id, price_tokens, popularity_count, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
        );
        const allItemsByVendor = new Map();
        insertedVendors.forEach((vendor) => {
            const baseNames = vendor.name.includes('Coffee')
                ? ['Espresso', 'Cappuccino', 'Latte', 'Americano', 'Mocha', 'Flat White', 'Iced Latte', 'Tea', 'Hot Chocolate', 'Cookie']
                : ['Classic Burger', 'Cheeseburger', 'Bacon Burger', 'Veggie Burger', 'Fries', 'Onion Rings', 'Chicken Burger', 'Double Burger', 'Milkshake', 'Salad'];
            const items = [];
            for (let i = 0; i < 10; i++) {
                const name = baseNames[i];
                const categoryName = vendor.name.includes('Coffee') ? (i <= 7 ? 'Drinks' : 'Snacks') : (i <= 7 ? 'Food' : 'Desserts');
                const cat = databaseRef.get('SELECT id FROM Categories WHERE name = ?', [categoryName]);
                const price = vendor.name.includes('Coffee') ? randomInt(2, 6) : randomInt(5, 12);
                const meta = JSON.stringify({ description: `${name} by ${vendor.name}` });
                itemStmt.run(vendor.id, name, cat && cat.id, price, randomInt(0, 250), meta);
                const inserted = databaseRef.get(
                    'SELECT id, price_tokens FROM Items WHERE vendor_id = ? AND name = ? ORDER BY id DESC LIMIT 1',
                    [vendor.id, name]
                );
                items.push(inserted);
            }
            allItemsByVendor.set(vendor.id, items);
        });

        // Transactions: 50 per vendor between vendor and users
        const txStmt = databaseRef.prepare(
            'INSERT INTO Transactions (uuid, walletSource_id, walletDestination_id, type, amount_tokens, item_id, vendor_id, location, timestamp, metadata, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
        );

        insertedVendors.forEach((vendor) => {
            const vendorUser = vendorUsers.find((vu) => vu.id === vendor.user_id);
            const vendorWallet = userIdToWallet.get(vendorUser.id);
            const items = allItemsByVendor.get(vendor.id) || [];
            for (let i = 0; i < 50; i++) {
                const buyer = randomChoice(insertedUsers.filter((u) => u.role === 'user'));
                const buyerWallet = userIdToWallet.get(buyer.id);
                const item = randomChoice(items);
                const amount = (item && item.price_tokens) || randomInt(3, 12);

                txStmt.run(
                    uuidv4(),
                    buyerWallet && buyerWallet.id,
                    vendorWallet && vendorWallet.id,
                    'purchase',
                    amount,
                    item && item.id,
                    vendor.id,
                    randomChoice(['Counter 1', 'Counter 2', 'Window', 'Table 4']),
                    daysAgo(randomInt(0, 30)),
                    JSON.stringify({ note: 'seeded purchase' }),
                    'completed'
                );

                // Update wallet balances to reflect the transaction
                if (buyerWallet) {
                    databaseRef.run('UPDATE Wallets SET balance_tokens = balance_tokens - ? WHERE id = ?', [amount, buyerWallet.id]);
                }
                if (vendorWallet) {
                    databaseRef.run('UPDATE Wallets SET balance_tokens = balance_tokens + ? WHERE id = ?', [amount, vendorWallet.id]);
                }
            }
        });
    });

    tx();
    return { seeded: true };
};
