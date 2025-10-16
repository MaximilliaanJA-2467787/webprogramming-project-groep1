const BaseRouter = require('../../base/router');

class WebRouter extends BaseRouter {
    constructor(express) {
        super(express);
    }

    bind() {
        this.get('/', 'GuestController::index', { name: 'home' });

        // Testing auth middleware
        this.get('/profile', 'UserAuth', (req, res) => {
            res.send('Profile');
        });

        this.get(
            '/support',
            (req, res) => {
                res.status(200).send('You are at the support page');
            },
            { name: 'support' }
        );

        super.bind();
    }
}

module.exports = WebRouter;
