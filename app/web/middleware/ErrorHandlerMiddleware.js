const BaseMiddleware = require('../../base/middleware');
const logger = require('../../utils/Logger');

class ErrorHandlerMiddleware extends BaseMiddleware {
    constructor() {
        super("ErrorHandler");
    }
    
    async handle(err, req, res, next) {
        if (err) {
            logger.logError(err);
            res.status(500).redirect('/error/500');
        } else {
            next();
        }
    }

    async after(req, res, next) {
        next();
    }
}

const errorHandler = new ErrorHandlerMiddleware().bind();
module.exports = errorHandler;
