const BaseRouter = require('../../base/router');

class ErrorRouter extends BaseRouter {
    constructor(express) {
        super(express);
    }

    bind() {

        this.get('/:status', "ErrorController::index");
        super.bind();
    }
}

module.exports = ErrorRouter;
