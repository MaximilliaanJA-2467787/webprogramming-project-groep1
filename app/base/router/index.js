const fs = require('fs');
const path = require('path');
const config = require('../../config');

class Router {
    constructor(expressApp, basePath = '') {
        if (!expressApp) throw new Error('Express instance required for Router');
        this.express = expressApp;
        this.basePath = basePath; // prefix for grouped routes
        this.controllerRegister = {};
        this.middlewareRegister = {};

        if (basePath === '') {
            // Only register controllers/middleware for the root Router
            this._registerControllers();
            this._registerMiddleware();
        }

        // Dynamically create route methods for HTTP verbs
        ['get', 'post', 'put', 'delete', 'patch', 'options'].forEach((method) => {
            this[method] = (route, ...handlers) => this._registerRoute(method, route, ...handlers);
        });

        this._routes = []; // store routes temporarily before binding
    }

    _scanFolderRecursively(folderPath) {
        let files = [];
        const entries = fs.readdirSync(folderPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(folderPath, entry.name);
            if (entry.isDirectory()) {
                files = files.concat(this._scanFolderRecursively(fullPath));
            } else if (entry.isFile() && entry.name.endsWith('.js')) {
                files.push(fullPath);
            }
        }
        return files;
    }

    _registerControllers() {
        const controllerPath = config.paths.controllers;
        const files = this._scanFolderRecursively(controllerPath);
        const register = {};
        for (const file of files) {
            const controllerExports = require(file);
            Object.assign(register, controllerExports);
        }
        this.controllerRegister = register;
    }

    _registerMiddleware() {
        const middlewarePath = config.paths.middleware;
        const files = this._scanFolderRecursively(middlewarePath);
        const register = {};
        for (const file of files) {
            const middlewareExports = require(file);
            Object.assign(register, middlewareExports);
        }
        this.middlewareRegister = register;
    }

    _getMiddlewareHandler(handler) {
        return this.middlewareRegister[handler];
    }

    _getControllerFunction(handler) {
        return this.controllerRegister[handler];
    }

    _resolveHandler(handler) {
        if (typeof handler === 'function') return handler;
        if (typeof handler === 'string') {
            let fn = this._getControllerFunction(handler);
            if (!fn) fn = this._getMiddlewareHandler(handler);
            if (!fn)
                throw new Error(
                    `Handler "${handler}" not found in controller or middleware registry.`
                );
            return fn;
        }
        throw new Error('Handler must be a function or a registered route string.');
    }

    _registerRoute(method, route, ...handlers) {
        if (handlers.length === 0) {
            throw new Error('No controller or middleware provided.');
        }

        // store route for later binding
        this._routes.push({ method, route, handlers });
    }

    // Register all stored routes to Express
    bind() {
        for (const { method, route, handlers } of this._routes) {
            const resolvedHandlers = handlers.map((h) => this._resolveHandler(h));
            const fullPath = path.posix.join(this.basePath, route);
            this.express[method](fullPath, ...resolvedHandlers);
        }
    }

    group(prefix, callback) {
        const groupRouter = new Router(this.express, path.posix.join(this.basePath, prefix));

        // Share the controller/middleware registries
        groupRouter.controllerRegister = this.controllerRegister;
        groupRouter.middlewareRegister = this.middlewareRegister;

        callback(groupRouter);

        // Bind group routes to express
        groupRouter.bind();
    }

    prefix(prefixString) {
        if (!prefixString) return;
        this._routes = this._routes.map(routeObj => {
            return {
                ...routeObj,
                route: path.posix.join(prefixString, routeObj.route)
            };
        });

        // Also update basePath so that future routes inherit the prefix
        this.basePath = path.posix.join(prefixString, this.basePath);
    }
}

module.exports = Router;
