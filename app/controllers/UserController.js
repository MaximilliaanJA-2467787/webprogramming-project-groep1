const ControllerBase = require("./ControllerBase");

class UserController extends ControllerBase {
    constructor() {
        super();
    }

    index(req, res, next) {
        let user = null;

        if (user == null) return res.redirect('/auth');

        res.render(
            'pages/user/index', {
                message: "Message from the user controller!",
                layout: 'layouts/default',
                user: user,
            }
        );
    }
}

const userController = new UserController();

module.exports = userController.bind();