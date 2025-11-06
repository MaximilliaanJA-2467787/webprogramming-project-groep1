const TransactionModel = require('../../data/models/TransactionModel');
const WalletModel = require('../../data/models/WalletModel');
const VendorModel = require('../../data/models/VendorModel');
const ItemModel = require('../../data/models/ItemModel');
const TransactionItemModel = require('../../data/models/TransactionItemModel');
const error = require('../../utils/error');

function wantsHtml(req) {
  const accept = req.headers.accept || '';
  return (
    accept.includes('text/html') ||
    req.headers['content-type'] === 'application/x-www-form-urlencoded'
  );
}

const PaymentsController = {
  showScanPage: async (req, res) => {
    return res.render('pages/payments/scan', {
      layout: 'layouts/default-layout',
      title: 'Scan to Pay - CashLess',
    });
  },

  showSuccessPage: async (req, res) => {
    return res.render('pages/payments/success', {
      layout: 'layouts/default-layout',
      title: 'Payment Success - CashLess',
    });
  },

  showErrorPage: async (req, res) => {
    return res.render('pages/payments/error', {
      layout: 'layouts/default-layout',
      title: 'Payment Error - CashLess',
      error: req.query && req.query.error ? decodeURIComponent(req.query.error) : null,
    });
  },
  showPayPage: async (req, res) => {
    try {
      const uuid = req.params.uuid;
      const tx = await TransactionModel.getByUuid(uuid);
      if (!tx) return error(res, 404);

      const vendor = tx.vendor_id ? await VendorModel.getById(tx.vendor_id) : null;
      const item = tx.item_id ? await ItemModel.getById(tx.item_id) : null;
      const lines = await TransactionItemModel.getByTransactionId(tx.id);

      return res.render('pages/payments/pay', {
        layout: 'layouts/default-layout',
        title: 'Confirm Payment',
        tx,
        vendor,
        item,
        lines,
      });
    } catch (err) {
      console.error(err);
      return error(res, 500);
    }
  },

  submitPayment: async (req, res) => {
    try {
      const uuid = req.params.uuid;
      const tx = await TransactionModel.getByUuid(uuid);
      if (!tx) return wantsHtml(req) ? res.redirect('/payments/pay/' + encodeURIComponent(uuid) + '?error=' + encodeURIComponent('Transaction not found')) : res.status(404).json({ error: 'not found' });
      if (tx.status === 'completed') return wantsHtml(req) ? res.redirect('/payments/success?success=' + encodeURIComponent('Already paid')) : res.json({ message: 'already paid' });

      // Payer wallet is the current user
      const userId = req.session.user && req.session.user.id;
      if (!userId) return wantsHtml(req) ? res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl)) : res.status(401).json({ error: 'unauthorized' });

      const payerWallet = await WalletModel.getByUserId(userId);
      if (!payerWallet) return wantsHtml(req) ? res.redirect('/wallet?error=' + encodeURIComponent('No wallet')) : res.status(400).json({ error: 'no wallet' });

      const amount = Number(tx.amount_tokens);
      if (payerWallet.balance_tokens < amount) {
        const msg = 'Insufficient balance';
        return wantsHtml(req) ? res.redirect('/payments/pay/' + encodeURIComponent(uuid) + '?error=' + encodeURIComponent(msg)) : res.status(400).json({ error: msg });
      }

      // Perform transfer: subtract from payer, add to destination wallet
      await WalletModel.update(payerWallet.id, { balance_tokens: Number(payerWallet.balance_tokens) - amount });
      if (tx.walletDestination_id) {
        const dest = await WalletModel.getById(tx.walletDestination_id);
        if (dest) {
          await WalletModel.update(dest.id, { balance_tokens: Number(dest.balance_tokens) + amount });
        }
      }

      // Set source wallet and mark completed
      await TransactionModel.update(tx.id, { walletSource_id: payerWallet.id });
      await TransactionModel.markCompletedById(tx.id);

      // Increment item popularity
      if (tx.item_id) {
        await ItemModel.incrementPopularity(tx.item_id, 1);
      }

      return wantsHtml(req)
        ? res.redirect('/payments/success?success=' + encodeURIComponent('Payment completed'))
        : res.json({ message: 'ok' });
    } catch (err) {
      console.error(err);
      return wantsHtml(req) ? res.redirect('/payments/error?error=' + encodeURIComponent('Payment failed')) : res.status(500).json({ error: 'internal error' });
    }
  },
};

module.exports = PaymentsController;


