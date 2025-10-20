const fs = require('fs');
const path = require('path');
const express = require('express');
const config = require('../../config/config');


function loadRoutes(app) {
    // Register controllers
    const controllerRegistry = {
        DefaultController: require('../../controllers/DefaultController'),
        UserController: require('../../controllers/UserController'),
        AuthController: require('../../controllers/AuthController'),
        ErrorController: require('../../controllers/ErrorController'),
    };

    // Register middleware
    const middlewareRegistry = {
        ErrorHandler: require('../../middlewares/ErrorHandlerMiddleware'),
    };

    useRoutes(app, controllerRegistry, middlewareRegistry);
}


function useRoutes(app, controllerRegistry, middlewareRegistry) {
    const routesDir = config.routesPath;
    const routeFiles = fs.readdirSync(routesDir).filter(file => file !== 'index.js' && file.endsWith('.js'));
    for (const file of routeFiles) {
        const routePath = path.join(routesDir, file);
        const routeModule = require(routePath);

        if (typeof routeModule === 'function') {
            const router = express.Router();
        
            routeModule(router, controllerRegistry, middlewareRegistry);
        
            const prefix = routeModule.prefix || '/';
            app.use(prefix, router);
            console.log(`Loaded routes: / (from ${file})`);
        }
    }

    app.use(middlewareRegistry.ErrorHandler.errorHandler());
}

module.exports = loadRoutes;