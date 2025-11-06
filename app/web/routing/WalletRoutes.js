const walletController = require('../controllers/WalletController');
const { requireAuth } = require('../middleware/auth');
const Pages = require('./Pages');

function loadWalletRoutes(app) {
    app.get(Pages.wallet.route, requireAuth(), walletController.show);

    // POST actions
    app.post('/wallet/deposit', requireAuth(), walletController.deposit);
    app.post('/wallet/withdraw', requireAuth(), walletController.withdraw);
    app.post('/wallet/transfer', requireAuth(), walletController.transfer);

    // JSON API routes
    app.get('/wallet/balance', requireAuth(), walletController.balance);
    app.get('/wallet/summary', requireAuth(), walletController.summary);

    // Payment routes
    const PaymentsController = require('../controllers/PaymentsController');
    const { requireRole } = require('../middleware/auth');
    app.get(
        '/payments/pay/:uuid',
        requireRole(['user', 'admin', 'vendor']),
        PaymentsController.showPayPage
    );
    app.post(
        '/payments/pay/:uuid',
        requireRole(['user', 'admin', 'vendor']),
        PaymentsController.submitPayment
    );
}

module.exports = loadWalletRoutes;
