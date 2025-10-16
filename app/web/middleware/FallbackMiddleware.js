const BaseMiddleware = require('../../base/middleware');
const logger = require('../../utils/Logger');

class FallbackMiddleware extends BaseMiddleware {
    constructor() {
        super("FallbackHandler");
    }
    
    async handle(req, res, next) {
        res.redirect('/error/404');
    }
}

const fallbackHandler = new FallbackMiddleware().bind();
module.exports = fallbackHandler;
