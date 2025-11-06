const Logger = require('../../utils/Logger');
const databaseRef = require('../../base/database/index').databaseRef;
const url = require('url');

const UserModel = require('../../data/models/UserModel');
const Pages = require('../routing/Pages');
const error = require('../../utils/error');

async function createVendor(req, res) {
  try {
    // parse & sanitize input
    const userId = req.body.user_id ? parseInt(req.body.user_id, 10) : null;
    const name = (req.body.name || '').trim();
    const location = req.body.location ? String(req.body.location).trim() : null;
    // form fields names: latitude and longitude (string), can be empty
    const latitude =
      typeof req.body.latitude !== 'undefined' && req.body.latitude !== ''
        ? parseFloat(req.body.latitude)
        : null;
    const longitude =
      typeof req.body.longitude !== 'undefined' && req.body.longitude !== ''
        ? parseFloat(req.body.longitude)
        : null;

    // basic validation
    if (!userId || Number.isNaN(userId)) {
      throw new Error('Invalid user selected.');
    }
    if (!name) {
      throw new Error('Vendor name is required.');
    }

    // check user exists
    const userRow = databaseRef.get('SELECT * FROM "Users" WHERE id = ?', [userId]);
    if (!userRow) {
      throw new Error(`User with id ${userId} not found.`);
    }

    // ensure there is no existing vendor for this user (business rule)
    const existingVendor = databaseRef.get('SELECT * FROM "Vendors" WHERE user_id = ?', [userId]);
    if (existingVendor) {
      throw new Error(`This user already has a vendor registered (vendor id: ${existingVendor.id}).`);
    }

    // Insert vendor
    const insertSql =
      'INSERT INTO "Vendors" (user_id, name, location, longitude, latitude) VALUES (?, ?, ?, ?, ?)';
    const info = databaseRef.run(insertSql, [
      userId,
      name,
      location,
      // Important: keep order longitude, latitude consistent with schema
      typeof longitude === 'number' && !Number.isNaN(longitude) ? longitude : null,
      typeof latitude === 'number' && !Number.isNaN(latitude) ? latitude : null,
    ]);

    const newId = info && typeof info.lastInsertRowid !== 'undefined' ? info.lastInsertRowid : null;
    Logger.info(`createVendor: created vendor id=${newId} for user ${userId}`);

    // Redirect back to admin page (you can append a query flag for UI feedback)
    return res.redirect('/admin?vendorCreated=1');
  } catch (err) {
    // Log the error and re-render the admin index with an error message so the modal can show it
    Logger.error(`createVendor failed: ${err.message}`);

    try {
      // Build same data as adminController.index so we can render the page with users and tables
      const tableInfo = await databaseRef.getAllTablesInfo(); // { tables: { users: [...], wallets: [...] } }
      const tableNames = Object.keys(tableInfo.tables || {});
      const tables = tableNames.map((name) => ({ name, columns: tableInfo.tables[name] }));

      const totalRows = tableNames.reduce((acc, t) => {
        const count = tableInfo.tables[t]?.length || 0;
        return acc + count;
      }, 0);

      // fetch users for select list
      const users = await UserModel.getAll();

      // pass vendorError so your modal can display it
      return res.render(Pages.admin.index.view, {
        layout: Pages.admin.index.layout,
        tables,
        tablesCount: tableNames.length,
        totalRows,
        users,
        vendorError: err.message,
      });
    } catch (renderErr) {
      // If rendering fails, fallback to generic error response
      Logger.error(`createVendor render fallback failed: ${renderErr.message}`);
      return error(res, 500);
    }
  }
}

module.exports = {
  createVendor,
};
