const fs = require('fs');
const path = require('path');
const config = require('../../config');
const logger = require('../../utils/Logger');

class Router {
    static globalRegistry = {};

    constructor(expressApp, basePath = '') {
        if (!expressApp) throw new Error('Express instance required for Router');
        this.name = this.constructor.name;
        this.express = expressApp;
        this.basePath = basePath;
        this.controllerRegister = {};
        this.middlewareRegister = {};

        if (basePath === '') {
            this._registerControllers();
            this._registerMiddleware();
        }

        ['get', 'post', 'put', 'delete', 'patch', 'options'].forEach((method) => {
            this[method] = (route, ...handlers) => this._registerRoute(method, route, ...handlers);
        });

        this._routes = [];
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

        let name = null;
        const last = handlers[handlers.length - 1];
        if (typeof last === 'object' && last.name) {
            name = last.name;
            handlers.pop();
        }

        this._routes.push({ method, route, handlers, name });
    }

    bind() {
        for (const { method, route, handlers, name } of this._routes) {
            const resolvedHandlers = handlers.map((h) => this._resolveHandler(h));
            const fullPath = path.posix.join(this.basePath, route);

            if (name) {
                if (Router.globalRegistry[name]) {
                    console.warn(`Duplicate route name detected: ${name}`);
                }
                Router.globalRegistry[name] = {
                    method: method.toUpperCase(),
                    path: fullPath,
                    handlers: resolvedHandlers,
                };
            }

            this.express[method](
                fullPath,
                (req, res, next) => {
                    if (name) {
                        res.locals.currentRoute = name;
                    } else {
                        res.locals.currentRoute = null;
                    }
                    next();
                },
                ...resolvedHandlers
            );
        }

        this._routes.forEach((route) => {
            let info = route.name ? 'with name: ' + route.name : '';
            logger.success(`[${this.name}] Bound route: '${this.basePath + route.route}' ${info}`);
        });
    }

    group(prefix, callback) {
        const groupRouter = new Router(this.express, path.posix.join(this.basePath, prefix));
        groupRouter.controllerRegister = this.controllerRegister;
        groupRouter.middlewareRegister = this.middlewareRegister;
        groupRouter.name = this.name;
        callback(groupRouter);
        groupRouter.bind();
    }

    static listRoutes() {
        return this.globalRegistry;
    }

    prefix(prefixString) {
        if (!prefixString) return;
        this._routes = this._routes.map((routeObj) => {
            return {
                ...routeObj,
                route: path.posix.join(prefixString, routeObj.route),
            };
        });

        this.basePath = path.posix.join(prefixString, this.basePath);
    }
}

module.exports = Router;
