class BaseController {
    constructor() {}

    bind() {
        const register = {};
        const proto = Object.getPrototypeOf(this);
        const className = this.constructor.name;

        // Get all method names (excluding constructor)
        const methods = Object.getOwnPropertyNames(proto).filter(
            (name) => typeof this[name] === 'function' && name !== 'constructor'
        );

        // Register each method
        for (const method of methods) {
            register[`${className}::${method}`] = this[method].bind(this);
        }

        return register;
    }
}

module.exports = BaseController;
