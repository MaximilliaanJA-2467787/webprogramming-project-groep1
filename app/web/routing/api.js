const BaseRouter = require('../../base/router');


class ApiRouter extends BaseRouter {
    constructor(express) {
        super(express);
    }

    bind() {
        this.group('/v1', (apiRouter) => {
            apiRouter.get('/health', 'HealthController::health');
        });

        super.bind();
    }
}

module.exports = ApiRouter;
