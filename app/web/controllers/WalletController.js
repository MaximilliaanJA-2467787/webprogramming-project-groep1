const walletModel = require('../../data/models/WalletModel');
const transactionModel = require('../../data/models/TransactionModel');
const userModel = require('../../data/models/UserModel');
const { v4: uuidv4 } = require('uuid');
const error = require('../../utils/error');
const Pages = require('../routing/Pages');
const Logger = require('../../utils/Logger');

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

    /**
     * POST /wallet/deposit
     * Add tokens to wallet
     */
    deposit: async (req, res) => {
        const { amount } = req.body;
        const amountNumber = parseFloat(amount);

        if (!amount || isNaN(amountNumber) || amountNumber < 0) {
            Logger.error('deposit error: amount/amountNumber not valid');
            return error(res, 400);
        }
        try {
            const userId = req.session?.user?.id || req.user?.id;
            const wallet = await walletModel.getByUserId(userId);
            if (!wallet) {
                Logger.error('deposit error: wallet not valid');
                return error(res, 404);
            }
            await walletModel.addTokens(userId, amountNumber);
            await transactionModel.createTransaction({
                uuid: uuidv4(),
                walletDestination_id: wallet.id,
                type: 'deposit',
                amount_tokens: amountNumber,
                status: 'completed',
                metadata: JSON.stringify({ method: 'manual_deposit' }),
            });

            return res.redirect('/wallet');
        } catch (err) {
            Logger.error('deposit error: try/catch error in deposit');
            return error(res, 500);
        }
    },

    /**
     * POST /wallet/withdraw
     * Remove tokens from wallet
     */
    withdraw: async (req, res) => {
        const { amount } = req.body;
        const amountNumber = parseFloat(amount);

        if (!amount || isNaN(amountNumber) || amountNumber < 0) {
            return error(res, 400);
        }

        try {
            const userId = req.session?.user?.id || req.user?.id;
            const wallet = await walletModel.getByUserId(userId);
            if (!wallet) {
                return error(res, 404);
            }

            await walletModel.removeTokens(userId, amountNumber);
            await transactionModel.createTransaction({
                uuid: uuidv4(),
                walletSource_id: wallet.id,
                type: 'withdraw',
                amount_tokens: amountNumber,
                status: 'completed',
                metadata: JSON.stringify({ method: 'manual_withdraw' }),
            });

            return res.redirect('/wallet');
        } catch (err) {
            if (err.message.includes('Insufficient balance')) {
                return error(res, 402);
            }
            Logger.error('withdraw error: problem in try/catch');
            return error(res, 500);
        }
    },

    /**
     * POST /wallet/transfer
     * Transfer tokens to another user (P2P)
     */
    transfer: async (req, res) => {
        const { recipient_email, amount } = req.body;
        const amountNumber = parseFloat(amount);

        if (!recipient_email || !amount || isNaN(amountNumber) || amountNumber < 0) {
            return error(res, 404);
        }

        try {
            const userId = req.session?.user?.id || req.user?.id;
            const recipient = await userModel.findOne({ email: recipient_email });
            if (!recipient) {
                return error(res, 404);
            }
            if (recipient.id === userId) {
                return error(res, 400);
            }

            const sourceWallet = await walletModel.getByUserId(userId);
            const destinationWallet = await walletModel.getByUserId(recipient.id);
            if (!sourceWallet || !destinationWallet) {
                return error(res, 404);
            }

            await walletModel.transfer(userId, recipient.id, amountNumber);
            await transactionModel.createTransaction({
                uuid: uuidv4(),
                walletSource_id: sourceWallet.id,
                walletDestination_id: destinationWallet.id,
                type: 'transfer',
                amount_tokens: amountNumber,
                status: 'completed',
                metadata: JSON.stringify({
                    recipient_name: recipient.name,
                    recipient_email: recipient.email,
                }),
            });
            return res.redirect('/wallet');
        } catch (err) {
            if (err.message.includes('Insufficient balance')) {
                return error(res, 402);
            }
            return error(res, 500);
        }
    },

    /**
     * GET /wallet/balance
     * Get current balance (JSON only - for API calls)
     */
    balance: async (req, res) => {
        try {
            const userId = req.session?.user?.id || req.user?.id;
            const balance = await walletModel.getBalance(userId);
            return res.JSON({ balance });
        } catch (err) {
            return res.status(500).json({ error: 'Failed to get balance' });
        }
    },

    /**
     * GET /wallet/summary
     * Get wallet summary with user info (JSON only - for API calls)
     */
    summary: async (req, res) => {
        try {
            const userId = req.session?.user?.id || req.user?.id;
            const summary = await walletModel.getSummary(userId);

            if (!summary) {
                return res.status(404).json({ error: 'Wallet not found' });
            }
            return res.json({ summary });
        } catch (err) {
            return res.status(500).json({ error: 'Failed to get summary' });
        }
    },
};

module.exports = walletController;
