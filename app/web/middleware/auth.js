const dbModule = require('../../base/database/index');
const UserModel = require('../../data/models/UserModel');
const error = require('../../utils/error');

function gotoLogin(req, res, error) {
    return res.status(401).redirect('/auth/login?error=' + encodeURIComponent(error) + '&redirect=' + encodeURIComponent(req.originalUrl));
}

function requireAuth() {
    return async (req, res, next) => {
        if (!req.session || !req.session.user || !req.session.user.id) {
            return gotoLogin(req, res, 'This page requires authentication, please log in.');
        }
        await attachFreshUser(req, res);
        return next();
    };
}

function requireRole(roles) {
    if (!roles) return requireAuth;

    const allowed = Array.isArray(roles) ? roles : [roles];

    return async (req, res, next) => {
        if (!req.session || !req.session.user || !req.session.user.id) {
            return gotoLogin(req, res, 'This page requires authentication, please log in.');
        }
        const userRole = req.session.user.role;

        if (!allowed.includes(userRole)) {
            return error(res, 403);
        }

        // same: don't pass next into attachFreshUser
        await attachFreshUser(req, res);

        return next();
    };
}

/**
 * attachFreshUser can be used two ways:
 *  1) as middleware: app.use(attachFreshUser) in that case `next` is provided and the function will call it.
 *  2) as a helper awaited by other middleware: await attachFreshUser(req, res) in that case it will NOT call next().
 */
async function attachFreshUser(req, res, next) {
    if (!req.session || !req.session.user || !req.session.user.id) {
        if (typeof next === 'function') return next();
        return;
    }

    try {
        const user = await UserModel.getById(req.session.user.id);

        if (!user) {
            try {
                req.session.destroy(() => {});
            } catch (e) {
                // ignore
            }
            req.user = null;
            res.locals.user = null;
            return gotoLogin(req, res, 'This page requires authentication, please log in.');
        }

        res.locals.user = user;
        req.session.user = { id: user.id, email: user.email, role: user.role, name: user.name };

        if (typeof next === 'function') return next();
        return;
    } catch (err) {
        console.error('attachFreshUser error', err);
        if (typeof next === 'function') return next();
        return;
    }
}

module.exports = {
    requireAuth,
    requireRole,
    attachFreshUser,
};
