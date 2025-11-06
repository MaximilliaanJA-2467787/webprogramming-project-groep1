const VendorController = require('../controllers/VendorController');
const { requireRole } = require('../middleware/auth');
const Pages = require('./Pages');

function loadVendorRoutes(app) {
    app.get(Pages.vendor.index.route, requireRole(['vendor', 'admin']), VendorController.dashboard);
    app.get(Pages.vendor.checkout.route, requireRole(['vendor', 'admin']), VendorController.checkout);
    
    app.post('/vendor/checkout/qrcode', requireRole(['vendor', 'admin']), VendorController.generateQRCode);

    // Vendor item management
    app.get('/vendor/items/new', requireRole(['vendor', 'admin']), VendorController.showNewItem);
    app.post('/vendor/items', requireRole(['vendor', 'admin']), VendorController.createItem);
    app.get('/vendor/items/:id/edit', requireRole(['vendor', 'admin']), VendorController.showEditItem);
    app.post('/vendor/items/:id', requireRole(['vendor', 'admin']), VendorController.updateItem);
    app.post('/vendor/items/:id/delete', requireRole(['vendor', 'admin']), VendorController.deleteItem);
}

module.exports = loadVendorRoutes;
