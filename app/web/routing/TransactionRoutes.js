const TransactionController = require('../controllers/TransactionsController');
const { requireAuth } = require('../middleware/auth');

function loadTransactionsRoutes(app) {
    app.get('/transactions', requireAuth(), TransactionController.showAll);
    app.get('/transactions/export', requireAuth(), TransactionController.exportTransactions);

    app.get('/api/transactions/:id', requireAuth(), TransactionController.getTransactionDetails);
}

module.exports = loadTransactionsRoutes;
