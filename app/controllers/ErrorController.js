const ControllerBase = require("./ControllerBase");
const ErrorModel = require("../models/ErrorModel");

class ErrorController extends ControllerBase {
    constructor() {
        super();
    }

    index(req, res, next) {

        let error = ErrorModel[req.params.statusCode];
        if (error == undefined) {
            return res.redirect('/error/404');
        }


        let title = error.title;
        let message = error.message;

        res.render(
            'pages/error', {
                title: title,
                message: message,
                status: req.params.statusCode,
                layout: 'layouts/error',
                timestamp: Date.now().toString(),
            }
        );
    }
}

const errorController = new ErrorController();


module.exports = errorController.bind();