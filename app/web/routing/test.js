const BaseRouter = require('../../base/router');


class TestRouter extends BaseRouter {
    constructor(express) {
        super(express);
    }

    bind() {
        this.get('/', 'TestController::index');
        this.get('/health', 'TestController::health');

        super.bind();
    }
}

module.exports = TestRouter;
