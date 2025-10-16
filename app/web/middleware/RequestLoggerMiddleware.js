const BaseMiddleware = require('../../base/middleware');
const logger = require('../../utils/Logger');

class RequestLoggerMiddleware extends BaseMiddleware {
    constructor() {
        super("RequestLogger");
    }

    async handle(req, res, next) {
        logger.logRequest(req);
        next();
    }

    async after(req, res, next) {
        logger.success(`Request completed: ${req.method} ${req.url}`);
        next();
    }
}

module.exports = new RequestLoggerMiddleware().bind();
