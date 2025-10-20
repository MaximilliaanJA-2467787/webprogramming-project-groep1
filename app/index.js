const ExpressApp = require('./base');
const logger = require('./utils/Logger');

class App extends ExpressApp {
    constructor() {
        super();
    }

    bindPreMiddlewares() {
        logger.info(`Binding Pre-middleware`);
        // Log each request
        this.bindMiddlewareModule('RequestLogger');
        this.bindMiddlewareModule('LayoutDataHandler');
    }

    bindRoutes() {
        logger.info(`Binding Routes`);
        // Web routes have no prefix
        this.bindRouteModule('web');

        // Api has prefix /api
        this.bindRouteModule('api', '/api');

        // Errors have prefix /error
        this.bindRouteModule('error', '/error');
    }

    bindPostMiddlewares() {
        logger.info(`Binding Post-middleware`);
        // If no error and no route matches yet
        this.bindMiddlewareModule('FallbackHandler');
        // As last
        this.bindMiddlewareModule('ErrorHandler');
    }
}

const app = new App();
module.exports = app;
