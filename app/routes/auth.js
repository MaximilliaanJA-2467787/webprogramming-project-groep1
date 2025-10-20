function authRoutes(router, controllers, middlewares) {

    const AuthController = controllers.AuthController;

    router.get(
        '/',
        (req, res, next) => {
            return res.redirect('/auth/login');
        }
    )

    router.get(
        '/login',
        AuthController.index
    );


    router.post(
        '/login',
        AuthController.validateLogin,
        AuthController.login
    );

    router.post(
        '/logout',
        AuthController.logout
    );
}


authRoutes.prefix = '/auth';


module.exports = authRoutes;
