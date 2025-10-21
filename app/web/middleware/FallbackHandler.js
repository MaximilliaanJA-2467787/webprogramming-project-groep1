const HttpError = require('../../utils/HTTPErrors.js');
const Pages = require('../routing/Pages.js');

const FallbackHandler = (req, res, next) => {
    if (!res.headersSent) {
        let status = 404;

        let error = HttpError(status);

        let data = {
            status: status,
            title: error.title,
            message: error.message,
            layout: 'layouts/error-layout'
        };
        
        return res.status(status).render(Pages.error.view, data);
    }
    next()
}

module.exports = FallbackHandler;