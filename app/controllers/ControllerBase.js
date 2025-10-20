class ControllerBase {
    constructor() {}

    error(status, next) {
        const err = new Error();
        err.status = status;
        return next(err);
    }

    bind() {
        const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(
            (prop) => typeof this[prop] === 'function' && prop !== 'constructor'
        );

        const boundMethods = {};
        for (const name of methodNames) {
            boundMethods[name] = this[name].bind(this);
        }

        return boundMethods;
    }
}

module.exports = ControllerBase;
