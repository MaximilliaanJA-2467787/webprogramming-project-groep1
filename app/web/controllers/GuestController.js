const GuestController = {
    
    index: (req, res) => {
        return res.render('pages/guest/index');
    },

    support: (req, res) => {
        return res.render('pages/guest/support');
    }

}


module.exports = GuestController;