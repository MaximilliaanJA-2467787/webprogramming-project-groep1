function errorRoutes(router, controllers, middlewares) {

    const ErrorController = controllers.ErrorController;

    router.get(
        '/error/:statusCode',
        ErrorController.index 
    );

}


module.exports = errorRoutes;
