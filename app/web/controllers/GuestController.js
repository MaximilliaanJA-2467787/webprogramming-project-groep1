const BaseController = require('../../base/controller');
const layout = require('../../base/controller/layout');
const view = require('../../base/controller/view');

class GuestController extends BaseController {
    constructor() {
        super();
    }

    index(req, res) {
        res.render(view('guest/index'), {
            title: 'Welcome to CashLess!',
            layout: layout('default-layout'),
        });
    }
}

const controller = new GuestController();
module.exports = controller.bind();
