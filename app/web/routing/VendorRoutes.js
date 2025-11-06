const VendorController = require('../controllers/VendorController');
const { requireRole } = require('../middleware/auth');
const Pages = require('./Pages');

function loadVendorRoutes(app) {
    app.get(Pages.vendor.index.route, requireRole(['vendor', 'admin']), VendorController.dashboard);
}

module.exports = loadVendorRoutes;
