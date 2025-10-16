class BaseMiddleware {
    constructor(name = null) {
        this.name = name;
    }

    // Overrideable
    async handle(req, res, next) {
        next();
    }

    // Overrideable
    async after(req, res, next) {
        next();
    }

    // Returns a function bound to the correct context for use in Express
    bind() {
        const register = {};
        const fn = this._createMiddleware();
        
        register[this.constructor.name] = fn;
        if (this.name) register[this.name] = fn;
        
        return register;
    }

    // Private helper to create middleware
    _createMiddleware() {
        const isErrorHandler = this.handle.length === 4;

        return isErrorHandler
            ? async (err, req, res, next) => this._execute(err, req, res, next)
            : async (req, res, next) => this._execute(undefined, req, res, next);
    }

    // Executes the main handler and the after hook
    async _execute(err, req, res, next) {
        try {
            if (err !== undefined) {
                await this.handle(err, req, res, next);
            } else {
                await this.handle(req, res, next);
            }
        } catch (error) {
            if (!res.headersSent) {
                next(error);
            } else {
                console.error('Error after headers sent:', error);
            }
        } finally {
            if (!res.headersSent && this.after) {
                try {
                    await this.after(req, res, next);
                } catch (error) {
                    next(error);
                }
            }
        }
    }

}

module.exports = BaseMiddleware;
