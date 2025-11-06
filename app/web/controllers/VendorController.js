// controllers/vendorController.js
const CurrencyModel = require('../../data/models/CurrencyModel');
const ItemModel = require('../../data/models/ItemModel');
const TransactionModel = require('../../data/models/TransactionModel');
const VendorModel = require('../../data/models/VendorModel');
const UserModel = require('../../data/models/UserModel');
const WalletModel = require('../../data/models/WalletModel');
const QRCode = require('qrcode');
const error = require('../../utils/error');
const Logger = require('../../utils/Logger');
const Pages = require('../routing/Pages');

function wantsHtml(req) {
  const accept = req.headers.accept || '';
  return (
    accept.includes('text/html') ||
    req.headers['content-type'] === 'application/x-www-form-urlencoded'
  );
}

const VendorController = {
  dashboard: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const vendor =  await VendorModel.getByUserId(userId);
      if (!vendor) {
        if (wantsHtml(req)) {
          return res.redirect('/?error=' + encodeURIComponent('Vendor not found for this account'));
        }
        return error(res, 403);
      }

      // Menu items
      const menu = await ItemModel.getMenuItems(vendor.id);

      // Recente transacties en paginatie
      const limit = 10;
      const offset = 0;
      const transactions = await TransactionModel.getRecentByVendor(vendor.id, { limit, offset });
      const totalTx = await TransactionModel.countByVendor(vendor.id);
      const totalPages = Math.max(1, Math.ceil(totalTx / limit));
      const pagination = { page: 1, limit, offset, total: totalTx, totalPages };


      const tokensSold = await TransactionModel.getTokensSoldForVendor(vendor.id);
      // Statistieken
      const stats = {
        tokensSold,
        revenueTokens: await CurrencyModel.tokensToEur(tokensSold),
        uniqueVisitors: await TransactionModel.getUniqueVisitorsCount(vendor.id),
        topItem: await TransactionModel.getTopItemForVendor(vendor.id),
        since: '7 days',
        period: '7d',
        revenueCurrency: '€', // optioneel: valuta conversie
      };

      // Chart data voorbeeld
      const chart = {
        labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        values: [10,20,15,25,30,20,18] // vervangen door echte weekdata via model
      };

      return res.render(Pages.vendor.index.view, {
        layout: Pages.vendor.index.layout,
        vendor,
        menu,
        transactions,
        pagination,
        stats,
        chart,
        breadcrumbs: [
          { label: 'Vendor', href: Pages.vendor.index.route },
          { label: 'Dashboard' }
        ],
        title: `${vendor.name} - Dashboard`
      });
    } catch (err) {
      console.error(err);
      if (wantsHtml(req)) {
        return res.redirect(Pages.vendor.index.route + '?error=' + encodeURIComponent('Internal server error'));
      }
      return error(res, 500);
    }
  },

  checkout: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const vendor =  await VendorModel.getByUserId(userId);
      if (!vendor) {
        if (wantsHtml(req)) {
          return res.redirect(Pages.vendor.index.route + '?error=' + encodeURIComponent('Vendor not found'));
        }
        return error(res, 403);
      }
      const items = await ItemModel.getMenuItems(vendor && vendor.id);

      return res.render(Pages.vendor.checkout.view, {
          layout: Pages.vendor.checkout.layout,
          title: `${vendor.name} - Checkout`,
          menu: items || [],
          vendor,
          breadcrumbs: [
            { label: 'Vendor', href: Pages.vendor.index.route },
            { label: 'Checkout' }
          ],
        });
    } catch (err) {
      console.error(err);
      if (wantsHtml(req)) {
        return res.redirect(Pages.vendor.index.route + '?error=' + encodeURIComponent('Failed to load checkout'));
      }
      return error(res, 500);
    }
  },

  generateQRCode: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const vendor =  await VendorModel.getByUserId(userId);
      if (!vendor) return res.status(403).json({ error: 'forbidden' });

      const user = await UserModel.getById(userId);
      if (!user) return res.status(403).json({ error: 'forbidden' });

      const walletDestination = await WalletModel.getByUserId(userId);
      if (!walletDestination) return res.status(403).json({ error: 'forbidden' });

      if (!req.body || typeof req.body.amount_tokens === 'undefined') {
        return res.status(400).json({ error: 'missing fields' });
      }

      const { v4: uuidv4 } = require('uuid');
      const txn = await TransactionModel.createTransaction({
        uuid: uuidv4(),
        walletDestination_id: walletDestination.id,
        vendor_id: vendor.id,
        location: req.body.location,
        type: 'purchase',
        amount_tokens: req.body.amount_tokens,
        item_id: req.body.item_id || null,
        status: 'pending',
      });

      // Persist optional line items (cart)
      try {
        const cart = Array.isArray(req.body.cart) ? req.body.cart : [];
        if (cart.length > 0) {
          const TransactionItemModel = require('../../data/models/TransactionItemModel');
          const lines = cart.map((c) => ({
            item_id: Number(c.id) || null,
            quantity: Number(c.quantity) || 1,
            unit_price_tokens: Number(c.price) || 0,
          }));
          await TransactionItemModel.createManyForTransaction(txn.id, lines);
        }
      } catch (e) {
        // Log but don't fail QR creation
        console.error('Failed to persist transaction items', e);
      }

      const qrCode = await QRCode.toDataURL('/payments/pay/' + encodeURIComponent(txn.uuid));
      return res.json({ qrCode, uuid: txn.uuid });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }
  ,

  // --- Item management ---
  showNewItem: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const vendor = await VendorModel.getByUserId(userId);
      if (!vendor) {
        if (wantsHtml(req)) {
          return res.redirect(Pages.vendor.index.route + '?error=' + encodeURIComponent('Vendor not found'));
        }
        return error(res, 403);
      }

      const categories = ItemModel._db().all('SELECT id, name FROM Categories ORDER BY name');
      return res.render('pages/vendor/item-form', {
        layout: Pages.vendor.index.layout,
        title: `${vendor.name} - New Item`,
        vendor,
        categories,
        item: null,
        action: '/vendor/items',
        method: 'POST',
        breadcrumbs: [
          { label: 'Vendor', href: Pages.vendor.index.route },
          { label: 'Items', href: Pages.vendor.index.route },
          { label: 'New' }
        ],
      });
    } catch (err) {
      console.error(err);
      if (wantsHtml(req)) {
        return res.redirect(Pages.vendor.index.route + '?error=' + encodeURIComponent('Failed to load item form'));
      }
      return error(res, 500);
    }
  },

  createItem: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const vendor = await VendorModel.getByUserId(userId);
      if (!vendor) {
        if (wantsHtml(req)) {
          return res.redirect(Pages.vendor.index.route + '?error=' + encodeURIComponent('Vendor not found'));
        }
        return error(res, 403);
      }

      const { name, category_id, new_category, price_tokens, description } = req.body;
      const trimmedName = (name || '').trim();
      const priceNum = Number(price_tokens);
      if (!trimmedName) {
        const msg = 'Name required';
        if (wantsHtml(req)) return res.redirect(Pages.vendor.index.route + '?error=' + encodeURIComponent(msg));
        return res.status(400).json({ error: msg });
      }
      if (!Number.isFinite(priceNum) || priceNum < 0 || !Number.isInteger(priceNum)) {
        const msg = 'Price must be a non-negative integer';
        if (wantsHtml(req)) return res.redirect(Pages.vendor.index.route + '?error=' + encodeURIComponent(msg));
        return res.status(400).json({ error: msg });
      }

      // Resolve category: prefer new_category if provided
      let resolvedCategoryId = category_id ? Number(category_id) : null;
      const newCat = (new_category || '').trim();
      if (newCat) {
        ItemModel._db().run('INSERT OR IGNORE INTO Categories (name) VALUES (?)', [newCat]);
        const row = ItemModel._db().get('SELECT id FROM Categories WHERE name = ?', [newCat]);
        if (row && row.id) {
          resolvedCategoryId = row.id;
        }
      }

      await ItemModel.createForVendor(vendor.id, {
        name: trimmedName,
        category_id: resolvedCategoryId,
        price_tokens: priceNum || 0,
        metadata: description ? JSON.stringify({ description }) : null,
        popularity_count: 0,
      });
      if (wantsHtml(req)) {
        return res.redirect(Pages.vendor.index.route + '?success=' + encodeURIComponent('Item created'));
      }
      return res.json({ message: 'ok' });
    } catch (err) {
      console.error(err);
      if (wantsHtml(req)) {
        return res.redirect(Pages.vendor.index.route + '?error=' + encodeURIComponent('Failed to create item'));
      }
      return res.status(500).json({ error: 'internal error' });
    }
  },

  showEditItem: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const vendor = await VendorModel.getByUserId(userId);
      if (!vendor) {
        if (wantsHtml(req)) {
          return res.redirect(Pages.vendor.index.route + '?error=' + encodeURIComponent('Vendor not found'));
        }
        return error(res, 403);
      }
      const id = Number(req.params.id);
      const item = await ItemModel.getByIdWithCategory(id);
      if (!item || item.vendor_id !== vendor.id) return error(res, 404);
      const categories = ItemModel._db().all('SELECT id, name FROM Categories ORDER BY name');
      return res.render('pages/vendor/item-form', {
        layout: Pages.vendor.index.layout,
        title: `${vendor.name} - Edit Item`,
        vendor,
        categories,
        item,
        action: `/vendor/items/${id}`,
        method: 'POST',
        breadcrumbs: [
          { label: 'Vendor', href: Pages.vendor.index.route },
          { label: 'Items', href: Pages.vendor.index.route },
          { label: 'Edit' }
        ],
      });
    } catch (err) {
      console.error(err);
      if (wantsHtml(req)) {
        return res.redirect(Pages.vendor.index.route + '?error=' + encodeURIComponent('Failed to load item'));
      }
      return error(res, 500);
    }
  },

  updateItem: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const vendor = await VendorModel.getByUserId(userId);
      if (!vendor) {
        if (wantsHtml(req)) {
          return res.redirect(Pages.vendor.index.route + '?error=' + encodeURIComponent('Vendor not found'));
        }
        return error(res, 403);
      }
      const id = Number(req.params.id);
      const item = await ItemModel.getById(id);
      if (!item || item.vendor_id !== vendor.id) return error(res, 404);

      const { name, category_id, new_category, price_tokens, description } = req.body;
      const trimmedName = (name || '').trim();
      const priceNum = Number(price_tokens);
      if (!trimmedName) {
        const msg = 'Name required';
        if (wantsHtml(req)) return res.redirect(Pages.vendor.index.route + '?error=' + encodeURIComponent(msg));
        return res.status(400).json({ error: msg });
      }
      if (!Number.isFinite(priceNum) || priceNum < 0 || !Number.isInteger(priceNum)) {
        const msg = 'Price must be a non-negative integer';
        if (wantsHtml(req)) return res.redirect(Pages.vendor.index.route + '?error=' + encodeURIComponent(msg));
        return res.status(400).json({ error: msg });
      }

      // Resolve category: prefer new_category if provided
      let resolvedCategoryId = category_id ? Number(category_id) : null;
      const newCat = (new_category || '').trim();
      if (newCat) {
        ItemModel._db().run('INSERT OR IGNORE INTO Categories (name) VALUES (?)', [newCat]);
        const row = ItemModel._db().get('SELECT id FROM Categories WHERE name = ?', [newCat]);
        if (row && row.id) {
          resolvedCategoryId = row.id;
        }
      }

      const payload = {
        name: trimmedName || item.name,
        category_id: resolvedCategoryId,
        price_tokens: priceNum || 0,
        metadata: description ? JSON.stringify({ description }) : null,
      };
      await ItemModel.update(id, payload);
      if (wantsHtml(req)) {
        return res.redirect(Pages.vendor.index.route + '?success=' + encodeURIComponent('Item updated'));
      }
      return res.json({ message: 'ok' });
    } catch (err) {
      console.error(err);
      if (wantsHtml(req)) {
        return res.redirect(Pages.vendor.index.route + '?error=' + encodeURIComponent('Failed to update item'));
      }
      return res.status(500).json({ error: 'internal error' });
    }
  },

  deleteItem: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const vendor = await VendorModel.getByUserId(userId);
      if (!vendor) {
        if (wantsHtml(req)) {
          return res.redirect(Pages.vendor.index.route + '?error=' + encodeURIComponent('Vendor not found'));
        }
        return error(res, 403);
      }
      const id = Number(req.params.id);
      const item = await ItemModel.getById(id);
      if (!item || item.vendor_id !== vendor.id) return error(res, 404);
      await ItemModel.delete(id);
      if (wantsHtml(req)) {
        return res.redirect(Pages.vendor.index.route + '?success=' + encodeURIComponent('Item deleted'));
      }
      return res.json({ message: 'ok' });
    } catch (err) {
      console.error(err);
      if (wantsHtml(req)) {
        return res.redirect(Pages.vendor.index.route + '?error=' + encodeURIComponent('Failed to delete item'));
      }
      return res.status(500).json({ error: 'internal error' });
    }
  }
};

module.exports = VendorController;
