function defaultRoutes(router, controllers, middlewares) {

    const DefaultController = controllers.DefaultController;

    router.get(
        '/',
        DefaultController.index
    );

}


module.exports = defaultRoutes;
