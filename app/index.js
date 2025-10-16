const ExpressApp = require("./base");

class App extends ExpressApp {
    constructor() {
        super();
    }

    bindPreMiddlewares() {
        this.bindMiddlewareModule('RequestLogger');
    }

    bindRoutes() {
        this.bindRouteModule('test', '/tests');
        this.bindRouteModule('web');
        this.bindRouteModule('error', '/error');
        this.bindRouteModule('api', '/api');
    }

    bindPostMiddlewares() {
        this.bindMiddlewareModule('FallbackHandler');
        this.bindMiddlewareModule('ErrorHandler');
    }
}

const app = new App();
module.exports = app;