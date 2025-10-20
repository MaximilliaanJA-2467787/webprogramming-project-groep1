const ControllerBase = require('./ControllerBase');

class AuthController extends ControllerBase {
    constructor() {
        super();
    }

    async index(req, res, next) {
        res.render('pages/auth/index', {
            message: 'Message from the auth controller!',
            layout: 'layouts/default',
        });
    }

    validateLogin(req, res) {}
    async login(req, res) {}

    async logout(req, res) {}
}

const authController = new AuthController();

module.exports = authController.bind();
