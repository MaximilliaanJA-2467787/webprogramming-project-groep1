const express = require('express');
const config = require('../config');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/Logger');

class ExpressApp {
    constructor() {
        this.express = null;
        this.port = config.server.port;
        this.env = config.env;
    }

    init() {
        this.express = express();
        this.express.set('view engine', config.view_engine);
        this.express.set('views', config.paths.views);
        this.express.use(expressLayouts);
        this.express.set('layout', 'layouts/default-layout');
        this.express.use(
            session({
                secret: 'Session-Key',
                resave: false,
                saveUninitialized: true,
                cookie: {
                    maxAge: 60000,
                },
            })
        );
        this.express.use(express.json());
        this.express.use(express.static(config.paths.public));

        // Expose ejs helpers:
        // For generating routes based on a name:
        this.express.locals.route = require('./controller/route');
    }

    // Overrideable
    bindPreMiddlewares() {}

    // Overrideable
    bindRoutes() {}

    // Overrideable
    bindPostMiddlewares() {}

    bindRouteModule(routerName, prefix = '') {
        const Router = require(path.join(config.paths.routes, routerName));
        const router = new Router(this.express);
        router.prefix(prefix);
        router.bind();
    }

    bindMiddlewareModule(middlewareName) {
        const files = fs.readdirSync(config.paths.middleware);

        let middlewareFile;
        for (const file of files) {
            const MiddlewareModule = require(path.join(config.paths.middleware, file));
            if (MiddlewareModule[middlewareName]) {
                middlewareFile = file;
                break;
            }
        }

        if (!middlewareFile) {
            throw new Error(`Middleware for alias "${middlewareName}" not found`);
        }

        const MiddlewareModule = require(path.join(config.paths.middleware, middlewareFile));
        logger.success(`Bound middleware: ${middlewareFile}`);
        this.express.use(MiddlewareModule[middlewareName]);
    }

    listen() {
        return this.express.listen(this.port, () => {
            logger.success(`Server running on port ${this.port}`);
            logger.info(`Environment: ${config.env}`);
        });
    }
}

module.exports = ExpressApp;
