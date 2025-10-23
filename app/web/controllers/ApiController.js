const QRCode = require('qrcode');

const ApiController = {
    
    qrcode: {
        create: async (req, res) => {
            const { transaction_id } = req.body;
            if (!transaction_id) {
                return res.status(400).json({ error: 'Missing transaction_id' });
            }

            try {
                const url = `/payments/pay?transaction=${encodeURIComponent(transaction_id)}`;
                const qrCodeDataUrl = await QRCode.toDataURL(url);
                return res.json({ qrCodeDataUrl });
            } catch (err) {
                console.error('QR generation error', err);
                return res.status(500).json({ error: 'Failed to generate QR code' });
            }
        },
    }

}


module.exports = ApiController;