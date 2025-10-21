const Logger = require('../../utils/Logger.js');
const Pages = require('../routing/Pages.js');
const HttpError = require('../../utils/HTTPErrors.js');

const ErrorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err) {
    Logger.logError(err, { method: req.method, url: req.originalUrl });
    res.locals.__errorLogged = true;
    let status = 500;
    let error = HttpError(status);

    let data = {
        status: status,
        title: error.title,
        message: error.message,
        layout: 'layouts/error-layout'
    };


    return res.status(status).render(Pages.error.view, data);
  } else {
    next();
  }
};


module.exports = ErrorHandler;
