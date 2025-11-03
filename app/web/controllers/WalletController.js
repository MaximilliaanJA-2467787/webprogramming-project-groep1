const walletModel = require('../../data/models/WalletModel');
const error = require('../../utils/error');
const Pages = require('../routing/Pages');

const walletController = {
    /**
     * GET wallet page
     */
    show: async (req, res) => {
        try {
            const userId = req.session.user?.id || req.user?.id;
            var wallet = await walletModel.getSummary(userId);

            if (!wallet) {
                await walletModel.createForUser(userId);
                wallet = await walletModel.getSummary(userId);
            }

            const { success, error } = req.query;
            return res.render('pages/user/wallet', {
                title: 'My Wallet - CashLess Events',
                wallet,
                user: req.session.user,
                layout: Pages.wallet.layout,
                success: success ? decodeURIComponent(success) : null,
                error: error ? decodeURIComponent(error) : null,
            });
        } catch (err) {
            return error(res, 404);
        }
    },
};

module.exports = walletController;
