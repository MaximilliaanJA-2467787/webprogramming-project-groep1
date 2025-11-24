const QRCode = require('qrcode');
const TransactionModel = require('../../data/models/TransactionModel');
const WalletModel = require('../../data/models/WalletModel');

const ApiController = {
    qrcode: {
        create: async (req, res) => {
            const { transaction_id } = req.body;
            if (!transaction_id) {
                return res.status(400).json({ error: 'Missing transaction_id' });
            }

            try {
                const url = `/payments/pay/${encodeURIComponent(transaction_id)}`;
                const qrCodeDataUrl = await QRCode.toDataURL(url);
                return res.json({ qrCodeDataUrl });
            } catch (err) {
                console.error('QR generation error', err);
                return res.status(500).json({ error: 'Failed to generate QR code' });
            }
        },
    },
    transactions: {
        getStatus: async (req, res) => {
            try {
                const uuid = req.params.uuid;
                if (!uuid) return res.status(400).json({ error: 'missing uuid' });
                const tx = await TransactionModel.getByUuid(uuid);
                if (!tx) return res.status(404).json({ error: 'not found' });
                let vendorBalance = null;
                if (tx.walletDestination_id) {
                    const dest = await WalletModel.getById(tx.walletDestination_id);
                    vendorBalance = dest ? dest.balance_tokens : null;
                }
                return res.json({ uuid: tx.uuid, status: tx.status, vendorBalance });
            } catch (err) {
                console.error('tx status error', err);
                return res.status(500).json({ error: 'internal error' });
            }
        },
        getByDate: async (req, res) => {
            try {
                const userId = req.session.user?.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }

                const date = req.query.date;
                if (!date) {
                    return res.status(400).json({ error: 'Date parameter required' });
                }

                const startDate = new Date(date);
                startDate.setHours(0, 0, 0, 0);
                
                const endDate = new Date(date);
                endDate.setHours(23, 59, 59, 999);

                const transactions = await TransactionModel.getTransactionByUserId(userId, {
                    status: 'completed',
                    type: 'purchase',
                    since: startDate.toISOString(),
                    until: endDate.toISOString(),
                    orderBy: 'timestamp',
                    orderDir: 'DESC',
                });

                return res.json({ transactions: transactions || [] });
            } catch (err) {
                console.error('getByDate error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
        },
        getByMonth: async (req, res) => {
            try {
                const userId = req.session.user?.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }

                const year = req.query.year;
                const month = req.query.month;
                
                if (!year || !month) {
                    return res.status(400).json({ error: 'Year and month parameters required' });
                }

                // Create start date (first day of month at 00:00:00)
                const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
                startDate.setHours(0, 0, 0, 0);
                
                // Create end date (last day of month at 23:59:59)
                const endDate = new Date(parseInt(year), parseInt(month), 0);
                endDate.setHours(23, 59, 59, 999);

                const transactions = await TransactionModel.getTransactionByUserId(userId, {
                    status: 'completed',
                    type: 'purchase',
                    since: startDate.toISOString(),
                    until: endDate.toISOString(),
                    orderBy: 'timestamp',
                    orderDir: 'DESC',
                });

                return res.json({ transactions: transactions || [] });
            } catch (err) {
                console.error('getByMonth error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
        },
    },
};

module.exports = ApiController;
