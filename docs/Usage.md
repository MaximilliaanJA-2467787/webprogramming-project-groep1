# Usage Guide

This document explains how to define and register **controllers**, **routes**, and **middleware** in your application.

**You learn best by example, take a look at:**
- `app/index.js` for route/middleware registering
- `app/web/routing/error.js` for route creation
- `app/web/middleware/RequestLoggerMiddleware.js` for middleware creation
- `app/web/controllers/ErrorController.js` for controller creation and rendering pages with layouts and data

---

## 1. Controllers

Controllers handle the logic for your routes. Each controller typically extends the `BaseController`.

### Example: `TestController`

```javascript
const BaseController = require('../../base/controller');

class TestController extends BaseController {
    constructor() {
        super();
    }

    index(req, res) {
        console.log('TestController index');
        res.send('Test Index');
    }

    health(req, res) {
        console.log('TestController health');
        res.json({ status: 'ok', timestamp: Date.now() });
    }
}

const controller = new TestController();
module.exports = controller.bind();
```

### Key Points:

* Extend `BaseController`.
* Define route methods (`index`, `health`, etc.).
* Export the bound controller instance using `.bind()`.

---

## 2. Middleware

Middleware can be **pre-route**, **post-route**, or **error-handling**. Each middleware extends `BaseMiddleware`.

### 2.1 Pre/Post Middleware

**Example: `RequestLoggerMiddleware`**

```javascript
const BaseMiddleware = require('../../base/middleware');
const logger = require('../../utils/Logger');

class RequestLoggerMiddleware extends BaseMiddleware {
    constructor() {
        super("RequestLogger");
    }

    async handle(req, res, next) {
        logger.logRequest(req);
        next();
    }

    async after(req, res, next) {
        logger.success(`Request completed: ${req.method} ${req.url}`);
        next();
    }
}

module.exports = new RequestLoggerMiddleware().bind();
```

* `handle()` is called **before route execution**.
* `after()` is called **after route execution**.

### 2.2 Error Handling Middleware

**Example: `ErrorHandlerMiddleware`**

```javascript
class ErrorHandlerMiddleware extends BaseMiddleware {
    async handle(err, req, res, next) {
        if (err) {
            logger.logError(err);
            res.status(500).redirect('/error/500');
        } else {
            next();
        }
    }
}
```

* Receives `err` as first parameter.
* Can handle errors and redirect or respond.

### 2.3 Fallback Middleware

**Example: `FallbackMiddleware`**

```javascript
class FallbackMiddleware extends BaseMiddleware {
    async handle(req, res, next) {
        res.redirect('/error/404');
    }
}
```

* Used as a catch-all for undefined routes.
* Typically registered **after all routes**.

---

## 3. Routes

Routes are grouped in `BaseRouter` classes and mapped to controller methods.

### 3.1 Creating a Router

```javascript
const BaseRouter = require('../../base/router');

class TestRouter extends BaseRouter {
    constructor(express) {
        super(express);
    }

    bind() {
        this.get('/', 'TestController::index');
        this.get('/health', 'TestController::health');

        super.bind();
    }
}

module.exports = TestRouter;
```

### 3.2 Defining Routes

* `this.get(path, 'Controller::method')`
* `this.post(path, 'Controller::method')`
* `this.put(path, 'Controller::method')`
* `this.delete(path, 'Controller::method')`

### 3.3 Grouping Routes

```javascript
this.group('/v1', (apiRouter) => {
    apiRouter.get('/', 'TestController::index');
    apiRouter.get('/health', 'TestController::health');
});
```

* Groups routes under a prefix (`/v1`).

---

## 4. Registering Routes with the App

All routes are registered in `app/index.js` using `bindRouteModule`.

```javascript
class App extends ExpressApp {
    bindRoutes() {
        this.bindRouteModule('test', '/tests');   // /tests -> TestRouter
        this.bindRouteModule('web');             // / -> WebRouter
        this.bindRouteModule('error', '/error'); // /error -> ErrorRouter
        this.bindRouteModule('api', '/api');     // /api -> ApiRouter
    }
}
```

* First parameter: router module name (folder/file in `app/web/routing/`).
* Second parameter (optional): route prefix.

---

## 5. Registering Middleware with the App

Middleware is registered in `bindPreMiddlewares` and `bindPostMiddlewares`.

```javascript
class App extends ExpressApp {
    bindPreMiddlewares() {
        this.bindMiddlewareModule('RequestLogger'); // Pre-route middleware
    }

    bindPostMiddlewares() {
        this.bindMiddlewareModule('FallbackHandler'); // Catch-all fallback
        this.bindMiddlewareModule('ErrorHandler');    // Error handling
    }
}
```

* `bindMiddlewareModule(name)` loads middleware from `app/web/middleware/`.
* Pre-middlewares run **before routes**.
* Post-middlewares run **after routes** or handle errors.

---

## 6. Error Routes

Error pages are defined in `ErrorController`:

```javascript
this.get('/:status', 'ErrorController::index');
```

* Allows dynamic error status handling.
* Example: `/error/404`, `/error/500`.

---

## 7. Summary

| Feature               | How to Define                                   | Registration Method                  |
| --------------------- | ----------------------------------------------- | ------------------------------------ |
| Controller            | Extend `BaseController`                         | `.bind()` and reference in router    |
| Route                 | `this.get/post/...` in `BaseRouter`             | `bindRouteModule('name', '/prefix')` |
| Middleware (pre/post) | Extend `BaseMiddleware`                         | `bindMiddlewareModule('name')`       |
| Error Middleware      | Extend `BaseMiddleware` with `handle(err, ...)` | `bindPostMiddlewares()`              |
| Fallback Middleware   | Extend `BaseMiddleware`                         | `bindPostMiddlewares()`              |

---

This structure allows:

1. **Adding new controllers** → Define methods, export bound instance.
2. **Adding new routes** → Create a router class, map paths to controller methods, register with app.
3. **Adding new middleware** → Extend `BaseMiddleware`, implement `handle`/`after`, register in app.


