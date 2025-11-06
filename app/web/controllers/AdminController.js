// controllers/adminController.js
const { databaseRef } = require('../../base/database');
const UserModel = require('../../data/models/UserModel');
const error = require('../../utils/error');
const Pages = require('../routing/Pages');
const AdminTableController = require('./AdminTableController');

const AdminController = {
    // Admin dashboard: /admin
    index: async (req, res) => {
        try {
            const tableInfo = await databaseRef.getAllTablesInfo(); // { tables: { users: [...], wallets: [...] } }
            const tableNames = Object.keys(tableInfo.tables || {});
            const tables = tableNames.map((name) => ({ name, columns: tableInfo.tables[name] }));

            // Optional metrics for dashboard (could be calculated or fetched)
            const totalRows = tableNames.reduce((acc, t) => {
                const count = tableInfo.tables[t]?.length || 0;
                return acc + count;
            }, 0);

            return res.render(Pages.admin.index.view, {
                layout: Pages.admin.index.layout,
                tables,
                tablesCount: tableNames.length,
                totalRows,
                users: await UserModel.getAll()
            });
        } catch (err) {
            console.error(err);
            return error(res, 500);
        }
    },

    // Tables list page: /admin/tables
    tables: async (req, res) => {
        try {
            const allInfo = await databaseRef.getAllTablesInfo(); // { tables: { users: [...], wallets: [...] } }
            const tableNames = Object.keys(allInfo.tables || {});
            const tables = tableNames.map((name) => ({ name, columns: allInfo.tables[name] }));

            return res.render(Pages.admin.tables.view, {
                layout: Pages.admin.index.layout,
                tables,
            });
        } catch (err) {
            console.error(err);
            return error(res, 500);
        }
    },

    // Specific table view: /admin/tables/:name
    table: async (req, res) => {
        try {
            const allInfo = await databaseRef.getAllTablesInfo(); // { tables: { users: [...], wallets: [...] } }
            const tableNames = Object.keys(allInfo.tables || {});
            const name = req.params.name;

            if (!tableNames.includes(name)) {
                return res.status(404).send('Table not found');
            }

            const columns = allInfo.tables[name] || [];

            // pagination
            let page = parseInt(req.query.page, 10) || 1;
            let perPage = parseInt(req.query.perPage, 10) || 50;
            perPage = Math.min(Math.max(perPage, 1), 50);
            if (page < 1) page = 1;

            // count total rows
            const countRow = databaseRef.get(`SELECT COUNT(1) as cnt FROM "${name}"`);
            const total = countRow ? countRow.cnt || 0 : 0;
            const totalPages = Math.max(1, Math.ceil(total / perPage));
            if (page > totalPages) page = totalPages;

            const offset = (page - 1) * perPage;

            // fetch rows safely (table name validated)
            const rows = databaseRef.all(`SELECT * FROM "${name}" LIMIT ? OFFSET ?`, [
                perPage,
                offset,
            ]);

            // optional CSV download
            if (req.query.download === 'csv') {
                const header = columns.map((c) => `"${c.name.replace(/"/g, '""')}"`).join(',');
                const csvRows = rows.map((r) =>
                    columns
                        .map((c) => {
                            let v = r[c.name];
                            if (v === null || v === undefined) return '""';
                            if (typeof v === 'object') v = JSON.stringify(v);
                            return `"${String(v).replace(/"/g, '""')}"`;
                        })
                        .join(',')
                );
                const csv = [header].concat(csvRows).join('\r\n');
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="${name}.csv"`);
                return res.send(csv);
            }

            const pagination = { page, perPage, total, totalPages };

            return res.render(Pages.admin.table.view, {
                layout: Pages.admin.index.layout,
                table: { name },
                columns,
                rows,
                pagination,
            });
        } catch (err) {
            console.error(err);
            return error(res, 500);
        }
    },

    createVendor: AdminTableController.createVendor,
};

module.exports = AdminController;
