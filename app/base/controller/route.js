const Router = require('../router');

function route(name, params = {}) {
    const r = Router.listRoutes()[name];
    if (!r) return '#';

    let path = r.path;
    // Replace :param in URL with actual values
    for (const [key, value] of Object.entries(params)) {
        path = path.replace(`:${key}`, encodeURIComponent(value));
    }

    return path;
}

module.exports = route;
