/**
 * Base Middleware class
 * Provides a template for creating custom middleware with before/after hooks
 */

class MiddlewareBase {
    // Overrideable
    async handle(req, res, next) {
        next();
    }

    // Overideable
    async handleError(err, req, res, next) {
        next(err);
    }

    // Overrideable
    async after(req, res) {}

    /**
     * Static method to apply middleware with before/after hooks
     * middlewareInstance, instance of middleware base class
     * routeHandler, the route handler function
     * returns wrapped middleware function
     */
    static applyMiddleware(middlewareInstance, routeHandler) {
        return async (req, res, next) => {
            try {
                // Run the before hook
                await middlewareInstance.handle(req, res, (err) => {
                    if (err) {
                        return next(err);
                    }

                    // Set up after hook to run when response finishes
                    res.on('finish', async () => {
                        try {
                            await middlewareInstance.after(req, res);
                        } catch (error) {
                            console.error('Error in middleware after hook:', error);
                        }
                    });

                    // Call the route handler
                    routeHandler(req, res, next);
                });
            } catch (error) {
                next(error);
            }
        };
    }

    //Create a middleware function that can be used with express
    handler() {
        return async (req, res, next) => {
            try {
                await this.handle(req, res, next);
            } catch (error) {
                next(error);
            }
        };
    }

    // Creates an error-handling middleware (err, req, res, next)
    errorHandler() {
        return async (err, req, res, next) => {
            try {
                await this.handleError(err, req, res, next);
            } catch (error) {
                next(error);
            }
        };
    }

    // Create a middleware function that wraps a route handler
    wrapRoute(routeHandler) {
        return MiddlewareBase.applyMiddleware(this, routeHandler);
    }
}

module.exports = MiddlewareBase;
