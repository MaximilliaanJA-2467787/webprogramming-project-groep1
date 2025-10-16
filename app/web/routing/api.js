const BaseRouter = require('../../base/router');

class ApiRouter extends BaseRouter {
    constructor(express) {
        super(express);
    }

    bind() {
        this.group('/v1', (apiRouter) => {
            apiRouter.get('/health', 'HealthController::health', { name: 'healthCheck' });
        });

        super.bind();
    }
}

module.exports = ApiRouter;
