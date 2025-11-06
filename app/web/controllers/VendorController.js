// controllers/vendorController.js
const CurrencyModel = require('../../data/models/CurrencyModel');
const ItemModel = require('../../data/models/ItemModel');
const TransactionModel = require('../../data/models/TransactionModel');
const VendorModel = require('../../data/models/VendorModel');
const error = require('../../utils/error');
const Logger = require('../../utils/Logger');
const Pages = require('../routing/Pages');

const VendorController = {
  dashboard: async (req, res) => {
    try {
      const userId = req.session.user.id;
      Logger.debug(JSON.stringify(req.session));
      const vendor =  await VendorModel.getByUserId(userId);
      if (!vendor) return error(res, 403);

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
        title: `${vendor.name} - Dashboard`
      });
    } catch (err) {
      console.error(err);
      return error(res, 500);
    }
  },
};

module.exports = VendorController;
