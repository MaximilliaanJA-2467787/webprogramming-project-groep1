const QRCode = require('qrcode');

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
                const TransactionModel = require('../../data/models/TransactionModel');
                const WalletModel = require('../../data/models/WalletModel');
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
        }
    }
};

module.exports = ApiController;
