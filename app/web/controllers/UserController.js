const WalletModel = require('../../data/models/WalletModel');
const TransactionModel = require('../../data/models/TransactionModel');
const Pages = require('../routing/Pages');

const UserController = {
    dashboard: async (req, res) => {
        const user = req.session.user;
        const wallet = await WalletModel.getSummary(user.id);
        // Basic recent transactions for this user as payer or receiver
        const tx = WalletModel.db.all(
            `SELECT t.*, v.name as vendor_name, i.name as item_name
             FROM Transactions t
             LEFT JOIN Vendors v ON t.vendor_id = v.id
             LEFT JOIN Items i ON t.item_id = i.id
             WHERE t.walletSource_id = (SELECT id FROM Wallets WHERE user_id = ?) 
                OR t.walletDestination_id = (SELECT id FROM Wallets WHERE user_id = ?)
             ORDER BY t.timestamp DESC LIMIT 10`,
            [user.id, user.id]
        );
        return res.render('pages/user/dashboard', {
            layout: 'layouts/default-layout',
            title: 'Dashboard - CashLess',
            user,
            wallet,
            transactions: tx,
        });
    },
};

module.exports = UserController;
