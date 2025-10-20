function userRoutes(router, controllers, middlewares) {

    const UserController = controllers.UserController;

    router.get(
        '/',
        UserController.index
    );
}

userRoutes.prefix = '/user';


module.exports = userRoutes;
