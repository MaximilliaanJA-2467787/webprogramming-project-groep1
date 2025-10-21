const GuestController = require("../controllers/GuestController");
const Pages = require("./Pages");

function loadGuestRoutes(app) {

    app.get(Pages.home.route, GuestController.index);
}

module.exports = loadGuestRoutes;