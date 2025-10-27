const dbModule = require('../../base/database/index');
const UserModel = require('../../data/models/UserModel');
const error = require('../../utils/error');

function gotoLogin(res, error) {
    return res.status(401).redirect('/auth/login?error=' + encodeURIComponent(error));
}

async function requireAuth(req, res, next) {
    if (!req.session || !req.session.user || !req.session.user.id) {
        return gotoLogin(res, 'This page requires authentication, please log in.');
    }

    await attachFreshUser();

    return next();
}

function requireRole(roles) {
    if (!roles) return requireAuth;

    const allowed = Array.isArray(roles) ? roles : [roles];

    return async (req, res, next) => {
        if (!req.session || !req.session.user || !req.session.user.id) {
            return gotoLogin(res, 'This page requires authentication, please log in.');
        }
        const userRole = req.session.user.role;
        if (!allowed.includes(userRole)) {
            return error(res, 403);
        }

        await attachFreshUser();

        return next();
    };
}

async function attachFreshUser(req, res, next) {
    if (!req.session || !req.session.user || !req.session.user.id) return next();

    try {
        const user = UserModel.getById(req.session.user.id);

        if (!user) {
            req.session.destroy(() => {});
            req.user = null;
            res.locals.user = null;
            return gotoLogin(res, 'This page requires authentication, please log in.');
        }

        res.locals.user = user;
        req.session.user = { id: user.id, email: user.email, role: user.role, name: user.name };
        return next();
    } catch (err) {
        console.error('attachFreshUser error', err);
        return next();
    }
}

module.exports = {
    requireAuth,
    requireRole,
    attachFreshUser,
};
