const ApiController = require('../controllers/ApiController');

function loadApiRoutes(app) {
    app.post('/api/v1/qrcode', ApiController.qrcode.create);
    app.get('/api/v1/transactions/:uuid', ApiController.transactions.getStatus);
    app.get('/api/transactions/by-date', ApiController.transactions.getByDate);
    app.get('/api/transactions/by-month', ApiController.transactions.getByMonth);
}

module.exports = loadApiRoutes;
