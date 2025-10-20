const ControllerBase = require('./ControllerBase');

class DefaultController extends ControllerBase {
    constructor() {
        super();
    }

    validate(req, res, next) {}

    index(req, res, next) {
        res.render('pages/index', {
            message: 'Message from the controller!',
            layout: 'layouts/default',
        });
    }
}

const defaultController = new DefaultController();

module.exports = defaultController.bind();
