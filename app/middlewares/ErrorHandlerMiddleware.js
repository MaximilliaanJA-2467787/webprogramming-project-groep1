const MiddlewareBase = require('./MiddlewareBase');

const config = require('../config/config');

class ErrorHandlerMiddleware extends MiddlewareBase {
    handleError(err, req, res, next) {
        // Skip non-error values
        if (!(err instanceof Error)) return next();

        // Log errors in development
        if (config.env === 'development') {
            console.error('ErrorHandlerMiddleware caught:', err);
        }

        // If response already in progress, delegate
        if (res.headersSent) return next(err);

        // Redirect to generic error page
        const status = err.status || 500;
        return res.redirect(`/error/${status}`);
    }

    async after(req, res) {
        // Optional cleanup logic
    }
}

const errorHandlerMiddleware = new ErrorHandlerMiddleware();
module.exports = errorHandlerMiddleware;
