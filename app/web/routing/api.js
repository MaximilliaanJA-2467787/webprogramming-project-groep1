const BaseRouter = require('../../base/router');


class ApiRouter extends BaseRouter {
    constructor(express) {
        super(express);
    }

    bind() {
        this.group('/v1', (apiRouter) => {
            apiRouter.get('/', 'TestController::index');
            apiRouter.get('/health', 'TestController::health');
        });

        super.bind();
    }
}

module.exports = ApiRouter;
