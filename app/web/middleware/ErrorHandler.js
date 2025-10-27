const Logger = require('../../utils/Logger.js');
const Pages = require('../routing/Pages.js');
const HttpError = require('../../utils/HTTPErrors.js');
const error = require('../../utils/error.js');

const ErrorHandler = (err, req, res, next) => {
    if (res.headersSent) return next(err);

    if (err) {
        Logger.logError(err, { method: req.method, url: req.originalUrl });
        res.locals.__errorLogged = true;
        return error(res, 500);
    } else {
        next();
    }
};

module.exports = ErrorHandler;
