const ExpressApp = require('./base');

class App extends ExpressApp {
    constructor() {
        super();
    }

    bindPreMiddlewares() {
        // Log each request
        this.bindMiddlewareModule('RequestLogger');
        this.bindMiddlewareModule('LayoutDataHandler');
    }

    bindRoutes() {
        // Web routes have no prefix
        this.bindRouteModule('web');

        // Api has prefix /api
        this.bindRouteModule('api', '/api');

        // Errors have prefix /error
        this.bindRouteModule('error', '/error');
    }

    bindPostMiddlewares() {
        // If no error and no route matches yet
        this.bindMiddlewareModule('FallbackHandler');

        // As last
        this.bindMiddlewareModule('ErrorHandler');
    }
}

const app = new App();
module.exports = app;
