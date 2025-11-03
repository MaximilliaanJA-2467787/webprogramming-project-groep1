const walletController = require('../controllers/WalletController');
const { requireAuth } = require('../middleware/auth');
const Pages = require('./Pages');

function loadWalletRoutes(app) {
    app.get(Pages.wallet.route, requireAuth, walletController.show);
}

module.exports = loadWalletRoutes;
