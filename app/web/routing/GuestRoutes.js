const GuestController = require('../controllers/GuestController');
const Pages = require('./Pages');

function loadGuestRoutes(app) {
    app.get(Pages.home.route, GuestController.index);
    app.get(Pages.support.route, GuestController.support);
    const PaymentsController = require('../controllers/PaymentsController');
    // QR scan and result pages through controller
    app.get('/payments/scan', PaymentsController.showScanPage);
    app.get('/payments/success', PaymentsController.showSuccessPage);
    app.get('/payments/error', PaymentsController.showErrorPage);
}

module.exports = loadGuestRoutes;
