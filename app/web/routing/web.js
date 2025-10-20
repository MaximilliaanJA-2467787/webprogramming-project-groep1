const BaseRouter = require('../../base/router');

class WebRouter extends BaseRouter {
    constructor(express) {
        super(express);
    }

    bind() {
        // Visible for all:
        this.get('/', 'GuestController::index', { name: 'home' });
        this.get('/support', 'GuestController::support', { name: 'support' });

        // Testing auth middleware
        this.get('/profile', 'UserAuth', (req, res) => {
            res.send('Profile');
        });

        super.bind();
    }
}

module.exports = WebRouter;
