const error = require("../../utils/error");

function enforceAuthorize(role = null) {
    return (req, res, next) => {
        const user = req.session.user;

        if (!user) {
            return error(res, 403);
        }

        // If a role is required, check it
        if (role && user.role !== role) {
            return error(res, 403);
        }

        res.locals.user = {
            id: user.id,
            username: user.username,
            role: user.role
        };

        return next();
    };
}

module.exports = enforceAuthorize;
