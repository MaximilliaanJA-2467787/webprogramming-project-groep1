const GuestController = require("../controllers/GuestController");
const authorizeRole = require("../middleware/AuthRole");
const Pages = require("./Pages");

function loadGuestRoutes(app) {
    app.get(Pages.home.route, GuestController.index);
    app.get(Pages.support.route, GuestController.support);
}


module.exports = loadGuestRoutes;