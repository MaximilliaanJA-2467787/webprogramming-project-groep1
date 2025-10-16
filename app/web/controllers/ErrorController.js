const BaseController = require('../../base/controller');
const getErrorData = require('../../base/controller/errors');
const layout = require('../../base/controller/layout');
const view = require('../../base/controller/view');

class ErrorController extends BaseController {
    constructor() {
        super();
    }

    index(req, res) {
        
        const data = {};

        // Where status is a wildcard in the route: /error/:status
        let error = getErrorData(req.params.status);

        data.title = error.title;
        data.message = error.message;
        data.status = error.status;

        data.layout = layout('error-layout');
        
        res.render(view('error'), data);

    }
}

const controller = new ErrorController();
module.exports = controller.bind();
