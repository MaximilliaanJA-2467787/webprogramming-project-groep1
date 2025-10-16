const config = require("../../config");
const path = require('path');

function view(name) {
    return path.join('pages', name);
}

module.exports = view;