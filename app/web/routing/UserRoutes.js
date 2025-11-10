const UserController = require('../controllers/UserController');
const { requireAuth } = require('../middleware/auth')
const Pages = require('./Pages');

function loadUserRoutes(app) {
    // User dashboard
    app.get('/dashboard', UserController.dashboard);

    // Profile routes
    app.get('/profile', requireAuth(), UserController.showProfile);
    app.post('/profile/update', requireAuth(), UserController.updateProfile);
    app.post('/profile/change-password', requireAuth(), UserController.changePassword);

    // Scan shortcut via controller
    const PaymentsController = require('../controllers/PaymentsController');
    app.get('/payments/scan', PaymentsController.showScanPage);
}

module.exports = loadUserRoutes;
