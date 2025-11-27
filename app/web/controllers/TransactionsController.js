const walletModel = require('../../data/models/WalletModel');
const transactionModel = require('../../data/models/TransactionModel');
const vendorModel = require('../../data/models/VendorModel');
const ItemModel = require('../../data/models/ItemModel');
const error = require('../../utils/error');
const Logger = require('../../utils/Logger');

const TransactionsController = {
    /**
     * GET /transactions - show all transactions page with filters
     */
    showAll: async (req, res) => {
        try {
            const userId = req.session.user?.id;
            if (!userId) {
                return res.redirect('/auth/login?redirect=/transactions');
            }

            const wallet = await walletModel.getByUserId(userId);
            if (!wallet) {
                Logger.error('Error in transactions showAll: wallet not found');
                return error(res, 404);
            }

            // Get filters from query params
            const filters = {
                search: req.query.search || '',
                status: req.query.status || '',
                type: req.query.type || '',
                dateFrom: req.query.dateFrom || '',
                dateTo: req.query.dateTo || '',
            };

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 25;
            const offset = (page - 1) * limit;

            // Build query options
            const queryOptions = {
                limit,
                offset,
                orderBy: 'timestamp',
                orderDir: 'DESC',
            };

            // adding filters to query
            if (filters.status) queryOptions.status = filters.status;
            if (filters.type) queryOptions.type = filters.type;
            if (filters.dateFrom) queryOptions.since = new Date(filters.dateFrom).toISOString();
            if (filters.dateTo) {
                const dateTo = new Date(filters.dateTo);
                dateTo.setHours(23, 59, 59, 999);
                queryOptions.until = dateTo.toISOString();
            }

            let transactions = await transactionModel.getTransactionByUserId(userId, queryOptions);

            // apply search filters
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                transactions = transactions.filter(transaction =>
                    (transaction.item_name && transaction.item_name.toLowerCase().includes(searchLower)) ||
                    (transaction.vendor_name && transaction.vendor_name.toLowerCase().includes(searchLower)) ||
                    (transaction.location && transaction.location.toLowerCase().includes(searchLower))
                );
            }

            const totalQueryOptions = {...queryOptions};
            delete totalQueryOptions.limit;
            delete totalQueryOptions.offset;

            let allTransactions = await transactionModel.getTransactionByUserId(userId, totalQueryOptions);

            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                allTransactions = allTransactions.filter(transaction =>
                    (transaction.item_name && transaction.item_name.toLowerCase().includes(searchLower)) ||
                    (transaction.vendor_name && transaction.vendor_name.toLowerCase().includes(searchLower)) ||
                    (transaction.location && transaction.location.toLowerCase().includes(searchLower))
                );
            }

            const total = allTransactions.length;
            const totalPages = Math.ceil(total/limit);

            // calculate stats
            const stats = calculateTransactionStats(allTransactions, wallet.id);

            const pagination = {
                page,
                limit,
                offset,
                total,
                totalPages,
            };

            return res.render('pages/user/allTransactions', {
                layout: 'layouts/default-layout',
                title: 'All Transactions - CashLess',
                user: req.session.user,
                wallet,
                transactions,
                filters,
                pagination,
                stats,
            });
        } catch (err) {
            Logger.error('Show all transactions error:');
            return error(res, 500);
        }
    },

    /**
     * GET /api/transactions/:id - get single transaction details 
     */
    getTransactionDetails: async (req, res) => {
        try {
            const userId = req.session.user?.id;
            if (!userId) {
                Logger.error('Error in transactions getTransactionDetails: userId not found');
                return error(res, 401);
            }

            const transactionId = parseInt(req.params.id);
            const transaction = await transactionModel.getById(transactionId);

            if (!transaction) {
                return error(res, 404);
            }

            const wallet = await walletModel.getByUserId(userId);
            if (!wallet || (transaction.walletSource_id !== wallet.id && transaction.walletDestination_id !== wallet.id)) {
                Logger.error('Error in transactions getTransactionDetails: userId not found');
                return error(res, 403);
            }

            // get extra details
            const vendor = transaction.vendor_id ? await vendorModel.getById(transaction.vendor_id) : null;
            const item = transaction.item_id ? await ItemModel.getById(transaction.item_id) : null;

            return res.json({
                ...transaction,
                vendor_name: vendor?.name,
                item_name: item?.name,
            });
        } catch (err) {
            Logger.error('Get transaction details error:');
            return error(res, 500)
        }
    },

    /**
     * GET /transactions/export - export transaction as CSV
     */
    exportTransactions: async (req, res) => {
        try {
            const userId = req.session.user?.id;
            if (!userId) {
                return res.redirect('/auth/login');
            }

            // Get all transactions without pagination
            const transactions = await transactionModel.getTransactionByUserId(userId, {
                orderBy: 'timestamp',
                orderDir: 'DESC',
            });

            // Create CSV content
            const headers = ['Date', 'Time', 'Type', 'Description', 'Vendor', 'Location', 'Amount', 'Status'];
            const csvRows = [headers.join(',')];

            transactions.forEach(tx => {
                const date = new Date(tx.timestamp);
                const row = [
                    date.toLocaleDateString('en-GB'),
                    date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                    tx.type,
                    `"${(tx.item_name || 'General Transaction').replace(/"/g, '""')}"`,
                    `"${(tx.vendor_name || '').replace(/"/g, '""')}"`,
                    `"${(tx.location || '').replace(/"/g, '""')}"`,
                    tx.amount_tokens,
                    tx.status,
                ];
                csvRows.push(row.join(','));
            });

            const csv = csvRows.join('\n');

            // Set headers for download
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="transactions_${Date.now()}.csv"`);
            
            return res.send(csv);
        } catch (err) {
            Logger.error('Export transactions error:');
            return error(res, 500);
        }
    },
}

/**
 * Helper function to calculate transaction stats
 */
function calculateTransactionStats(transactions, walletId) {
    let totalSpent = 0;
    let totalReceived = 0;

    transactions.forEach(transaction => {
        const amount = Number(transaction.amount_tokens);
        if (transaction.walletSource_id === walletId) {
            totalSpent += amount;
        }
        if (transaction.walletDestination_id === walletId) {
            totalReceived += amount;
        }
    });

    const count = transactions.length;
    const average = count > 0 ? ((totalSpent + totalReceived) / count).toFixed(2) : 0;

    return {
        totalSpent,
        totalReceived,
        count,
        average,
    };
}

module.exports = TransactionsController;