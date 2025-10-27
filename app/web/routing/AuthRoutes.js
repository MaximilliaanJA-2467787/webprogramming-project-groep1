const AuthController = require('../controllers/AuthController');
const Pages = require('./Pages');

function loadAuthRoutes(app) {
    // GET routes - Show pages
    app.get(Pages.login.route, AuthController.showLogin);
    app.get(Pages.register.route, AuthController.showRegister);
    app.get(Pages.forgotPassword.route, AuthController.showForgotPassword);
    app.get(Pages.resetPassword.route, AuthController.showResetPassword);
    app.get('/dashboard', AuthController.dashboard);

    // POST routes - Process forms
    app.post('/auth/login', AuthController.login);
    app.post('/auth/register', AuthController.register);
    app.post('/auth/logout', AuthController.logout);
    app.post('/auth/forgot-password', AuthController.forgotPassword);
    app.post('/auth/reset-password', AuthController.resetPassword);
}

module.exports = loadAuthRoutes;
