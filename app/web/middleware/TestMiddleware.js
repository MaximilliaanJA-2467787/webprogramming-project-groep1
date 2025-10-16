const BaseMiddleware = require('../../base/middleware');

class TestMiddleware extends BaseMiddleware {
    constructor() {
        super();
    }

    async handle(req, res, next) {
        console.log('TestMiddleware Handled');
        next();
    }

    async after(req, res, next) {
        console.log('TestMiddleware Cleaned Up');
        next();
    }
}

const middleware = new TestMiddleware();
module.exports = middleware.bind();
