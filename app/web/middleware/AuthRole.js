const error = require("../../utils/error");

function authorizeRole(role) {
    return (req, res, next) => {
        if (req.session.user?.role === role) {
            return next();
        }
        
        return error(res, 403);
    };
}

module.exports = authorizeRole;