const BaseController = require('../../base/controller');
const logger = require('../../utils/Logger');

class HealthController extends BaseController {
    constructor() {
        super();
    }

    health(req, res) {
        res.json({ status: 200, message: 'ok', timestamp: logger.getTimestamp() });
    }
}

const controller = new HealthController();
module.exports = controller.bind();
