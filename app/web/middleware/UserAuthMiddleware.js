const route = require('../../base/controller/route');
const BaseMiddleware = require('../../base/middleware');

class UserAuthMiddleware extends BaseMiddleware {
    constructor() {
        super('UserAuth');
    }

    async handle(req, res, next) {
        try {
            // Common places to find authenticated user:
            const sessionUser = req.session && req.session.user;
            const user = sessionUser || req.user;

            if (user) {
                // Ensure req.user is populated for downstream handlers
                if (!req.user) req.user = user;

                // Only stored userId in session:
                // if (req.session.userId && !req.user.fullProfile) {
                //   try {
                //     const fullUser = await UserModel.findById(req.session.userId);
                //     if (fullUser) req.user = fullUser;
                //   } catch (err) {
                //     // log DB error but allow next() to run or handle as needed
                //     return next(err);
                //   }
                // }

                res.locals.user = user;

                return next();
            }

            // Not authenticated:
            // Save return URL for GET so you can redirect back after login
            if (req.method === 'GET' && req.session) {
                req.session.returnTo = req.originalUrl || req.url;
            }

            // Detect AJAX / API requests: prefer JSON 401
            const wantsJson =
                req.xhr ||
                (req.headers.accept && req.headers.accept.indexOf('application/json') !== -1) ||
                (req.headers['content-type'] &&
                    req.headers['content-type'].indexOf('application/json') !== -1);

            if (wantsJson) {
                return res.redirect('/error/401');
            }

            // Default: redirect to login page -> TODO: use session.redirectTo in login
            return res.redirect('/login');
        } catch (err) {
            return next(err);
        }
    }
}

const authHandler = new UserAuthMiddleware().bind();
module.exports = authHandler;
