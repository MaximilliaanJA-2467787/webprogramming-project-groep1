const WalletModel = require('../../data/models/WalletModel');
const TransactionModel = require('../../data/models/TransactionModel');
const userModel = require('../../data/models/UserModel');
const Logger = require('../../utils/Logger');
const config = require('../../config/Config');
const error = require('../../utils/error');
const bcrypt = require('bcrypt');
const Pages = require('../routing/Pages');
const UserModel = require('../../data/models/UserModel');

const SALT_ROUNDS = config.session.salt_rounds;

const UserController = {
    dashboard: async (req, res) => {
        const user = req.session.user;
        const wallet = await WalletModel.getSummary(user.id);
        // Basic recent transactions for this user as payer or receiver
        const tx = WalletModel.db.all(
            `SELECT t.*, v.name as vendor_name, i.name as item_name
             FROM Transactions t
             LEFT JOIN Vendors v ON t.vendor_id = v.id
             LEFT JOIN Items i ON t.item_id = i.id
             WHERE t.walletSource_id = (SELECT id FROM Wallets WHERE user_id = ?) 
                OR t.walletDestination_id = (SELECT id FROM Wallets WHERE user_id = ?)
             ORDER BY t.timestamp DESC LIMIT 10`,
            [user.id, user.id]
        );
        return res.render('pages/user/dashboard', {
            layout: 'layouts/default-layout',
            title: 'Dashboard - CashLess',
            user,
            wallet,
            transactions: tx,
        });
    },

    // GET /profile - Show profile page
    showProfile: async (req, res) => {
        try {
            const user = req.session.user;
            const userModel = await UserModel.getById(user.id);

            if (!user) {
                return error(res, 404);
            }
            const { success, error: errorMsg } = req.query;

            return res.render('pages/user/profile', {
                layout: 'layouts/default-layout',
                title: 'My Profile - CashLess',
                user: userModel,
                success: success ? decodeURIComponent(success) : null,
                error: errorMsg ? decodeURIComponent(errorMsg) : null,
            });
        } catch (err) {
            Logger.error('showProfile error in catch', err);
            return error(res, 500);
        }
    },

    // POST /profile/update - Update profile info
    updateProfile: async (req, res) => {
        try {
            const userId = req.session.user.id;
            const { name, email } = req.body;

            if (!name || !name.trim() || !email || !email.trim()) {
                return error(res, 400);
            }

            const existingUser = await userModel.findOne({ email: email.trim() });
            if (existingUser && existingUser.id != userId) {
                return error(res, 409);
            }

            const updatedUser = await userModel.update(userId, {
                name: name.trim(),
                email: email.trim(),
            });

            if (!updatedUser) {
                return error(res, 500);
            }

            req.session.user.name = updatedUser.name;
            req.session.user.email = updatedUser.email;

            return res.render('pages/user/profile', {
                layout: 'layouts/default-layout',
                title: 'Profile Updated - CashLess',
                user: updatedUser,
                success: 'Profile updated successfully',
                error: null,
            });
        } catch (err) {
            Logger.error('updateProfile error in catch', err);
            return error(res, 500);
        }
    },

    // POST /profile/change-password - Change password
    changePassword: async (req, res) => {
        try {
            const userId = req.session.user.id;
            const { currentPassword, newPassword, confirmPassword } = req.body;

            // validate input
            if (!currentPassword || !newPassword || !confirmPassword) {
                Logger.info('not all fields filed in');
                return error(res, 400);
            }
            if (newPassword !== confirmPassword) {
                Logger.info('newPassfword not equal to confirmedPassword');
                return error(res, 400);
            }

            if (newPassword.length < 8) {
                Logger.info('NewPassword not to short');
                return error(res, 400);
            }

            const user = await userModel.getById(userId);
            if (!user) {
                return error(res, 404);
            }

            // verify current password
            Logger.info('Reached password match');
            const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
            if (!passwordMatch) {
                return error(res, 401);
            }

            Logger.info('Reached new password hash');
            const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

            Logger.info('reached update userModel');
            await userModel.update(userId, {
                password_hash: newPasswordHash,
            });
            return res.redirect('/profile');
        } catch (err) {
            Logger.error('changePassword error in catch:', err);
            return error(res, 500);
        }
    },
};

module.exports = UserController;
