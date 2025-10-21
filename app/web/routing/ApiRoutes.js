const ApiController = require('../controllers/ApiController');

function loadApiRoutes(app) {

    app.post('/api/v1/qrcode', ApiController.qrcode.create);

    
}

module.exports = loadApiRoutes;