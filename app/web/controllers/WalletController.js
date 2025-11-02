const walletModel = require('../../data/models/WalletModel')

const walletController = {
    /**
     * GET wallet page
     */
    show: async (req, res) => {
        try{
            const userId = req.session.user?.id || req.user?.id;
            console.log('userId:', userId);
            const wallet = await walletModel.getSummary(userId);

            if (!wallet) {
                return res.redirect('dashboard?error=' + encodeURIComponent('Wallet not found'));
            }

            const { success, error } = req.query;
            return res.render('pages/user/wallet', {
                title: 'My Wallet - CashLess Events',
                wallet,
                user: req.session.user,
                layout: 'layouts/default-layout',
                success: success ? decodeURIComponent(success) : null,
                error: error ? decodeURIComponent(error) : null,
            });
        } catch (err) {
            console.error('Wallet show error', err);
            return res.redirect('/dashboard?error=' + encodeURIComponent('Failed to load wallet'));
        }
    }
};

module.exports = walletController;