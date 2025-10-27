const Pages = require('../web/routing/Pages');
const HttpError = require('./HTTPErrors');

function error(res, status) {
    let error = HttpError(status);

    let data = {
        status: status,
        title: error.title,
        message: error.message,
        layout: 'layouts/error-layout',
    };

    return res.status(status).render(Pages.error.view, data);
}

module.exports = error;
