const UserController = require('../controllers/UserController');
const Pages = require('./Pages');

function loadUserRoutes(app) {
    // User dashboard
    app.get('/dashboard', UserController.dashboard);
    // Scan shortcut via controller
    const PaymentsController = require('../controllers/PaymentsController');
    app.get('/payments/scan', PaymentsController.showScanPage);
}

module.exports = loadUserRoutes;
