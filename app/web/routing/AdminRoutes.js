const AdminController = require('../controllers/AdminController');
const { requireRole } = require('../middleware/auth');
const Pages = require('./Pages');

function loadAdminRoutes(app) {
    // GET show pages
    app.get(Pages.admin.index.route, requireRole('admin'), AdminController.index);
    app.get(Pages.admin.tables.route, requireRole('admin'), AdminController.tables);
    app.get(Pages.admin.table.route, requireRole('admin'), AdminController.table);

    app.post('/admin/vendors/create', requireRole('admin'), AdminController.createVendor);
}

module.exports = loadAdminRoutes;
