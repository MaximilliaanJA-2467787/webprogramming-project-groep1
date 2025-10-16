const BaseController = require('../../base/controller');

class TestController extends BaseController {
    constructor() {
        super();
    }

    index(req, res) {
        console.log('TestController index');
        res.send('Test Index');
    }

    health(req, res) {
        console.log('TestController health');
        res.json({ status: 'ok', timestamp: Date.now() });
    }
}

const controller = new TestController();
module.exports = controller.bind();
