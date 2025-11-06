const walletController = require('../controllers/WalletController');
const { requireAuth } = require('../middleware/auth');
const Pages = require('./Pages');

function loadWalletRoutes(app) {
    app.get(Pages.wallet.route, requireAuth(), walletController.show);
    // Payment routes
    const PaymentsController = require('../controllers/PaymentsController');
    const { requireRole } = require('../middleware/auth');
    app.get('/payments/pay/:uuid', requireRole(['user', 'admin', 'vendor']), PaymentsController.showPayPage);
    app.post('/payments/pay/:uuid', requireRole(['user', 'admin', 'vendor']), PaymentsController.submitPayment);
}

module.exports = loadWalletRoutes;
