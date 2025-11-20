const transactionModel = require('../../data/models/TransactionModel');
const walletModel = require('../../data/models/WalletModel');
const Logger = require('../../utils/Logger');
const error = require('../../utils/error');

const AnalyticsController = {
    /**
     * GET /analytics - Show analytics page with spending overview
     */
    show: async (req, res) => {
        try {
            const userId = req.session.user?.id;
            if (!userId) {
                return res.redirect('auth/login?redirect=/analytics');
            }
            Logger.debug(`Analytics requested for user ${userId}`);

            const wallet = await walletModel.getByUserId(userId);
            if (!wallet) {
                Logger.error('Error in Analytics show: wallet not found');
                return error(res, 404);
            }

            // get period, start- and endDate and groupBy
            const period = req.query.period || 'month';
            const { startDate, endDate, groupBy } = getDateRange(period);

            Logger.debug(
                `Period: ${period}, Start: ${startDate}, End: ${endDate}, GroupBy: ${groupBy}`
            );

            // get all needed transactions
            const transactions = await transactionModel.getTransactionByUserId(userId, {
                status: 'completed',
                type: 'purchase',
                since: startDate,
                until: endDate,
                orderBy: 'timestamp',
                orderDir: 'ASC',
            });

            //aggregate data for charts
            const aggregatedData = aggregateTransactions(transactions, groupBy, startDate, endDate);
            Logger.info('Aggregated time data successfully');

            const categoryData = aggregateByCategory(transactions);
            Logger.info('Aggregated category data successfully');

            const vendorData = aggregateByVendor(transactions);
            Logger.info('Aggregated vendor data successfully');

            const stats = calculateStats(transactions);
            Logger.info('Calculated stats successfully');

            return res.render('pages/user/analytics', {
                layout: 'layouts/default-layout',
                title: 'Spending Analytics - CashLess',
                user: req.session.user,
                wallet,
                period,
                stats,
                chartData: JSON.stringify(aggregatedData),
                categoryData: JSON.stringify(categoryData),
                vendorData: JSON.stringify(vendorData),
                transactions,
            });
        } catch (err) {
            Logger.error('Analytics show error');
            return error(res, 500);
        }
    },
};

/**
 * Helper: Get date range and grouping based on period
 */
function getDateRange(period) {
    const now = new Date();
    let startDate, endDate, groupBy;

    endDate = now.toISOString();

    switch (period) {
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
            groupBy = 'day';
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            groupBy = 'day';
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1).toISOString();
            groupBy = 'month';
            break;
        case 'alltime':
            startDate = new Date(0).toISOString();
            groupBy = 'month';
            break;
        default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            groupBy = 'day';
            break;
    }

    return { startDate, endDate, groupBy };
}

/**
 * Helper: Aggregate transactions by time period
 */
function aggregateTransactions(transactions, groupBy, startDate, endDate) {
    const dataMap = new Map();
    initializePeriods(dataMap, groupBy, startDate, endDate);
    addTransactionsToPeriods(dataMap, transactions, groupBy);
    return createChartData(dataMap, groupBy);
}

/**
 * Initializes all periods with 0
 */
function initializePeriods(dataMap, groupBy, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (groupBy === 'day') {
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const key = date.toISOString().split('T')[0];
            dataMap.set(key, 0);
        }
    } else if (groupBy === 'month') {
        for (let date = new Date(start); date <= end; date.setMonth(date.getMonth() + 1)) {
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const key = `${date.getFullYear()}-${month}`;
            dataMap.set(key, 0);
        }
    }
}

/**
 * add all transaction per period
 */
function addTransactionsToPeriods(dataMap, transactions, groupBy) {
    transactions.forEach((transaction) => {
        const date = new Date(transaction.timestamp);
        const key = getPeriodKey(date, groupBy);

        // add amount to current amount
        const currentAmount = dataMap.get(key) || 0;
        const newAmount = currentAmount + Number(transaction.amount_tokens);
        dataMap.set(key, newAmount);
    });
}

/**
 * make key for period
 */
function getPeriodKey(date, groupBy) {
    if (groupBy === 'day') {
        return date.toISOString().split('T')[0];
    } else {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${date.getFullYear()}-${month}`;
    }
}

/**
 * Set data to Chart.js format
 */
function createChartData(dataMap, groupBy) {
    const labels = [];
    const values = [];

    dataMap.forEach((value, key) => {
        labels.push(formatLabel(key, groupBy));
        values.push(value);
    });

    return {
        labels: labels,
        datasets: [
            {
                label: 'Spending (tokens)',
                data: values,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                tension: 0.4,
                fill: true,
            },
        ],
    };
}

/**
 * format labels for graph
 */
function formatLabel(key, groupBy) {
    if (groupBy === 'day') {
        return new Date(key).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    } else {
        const [year, month] = key.split('-');
        return new Date(year, month - 1).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
        });
    }
}

/**
 * Helper: Aggregate by category
 */
function aggregateByCategory(transactions) {
    const categorieMap = new Map();

    transactions.forEach((transaction) => {
        const categorie = transaction.item_category || 'Other';
        const current = categorieMap.get(categorie) || 0;
        categorieMap.set(categorie, current + Number(transaction.amount_tokens));
    });

    return {
        labels: Array.from(categorieMap.keys()),
        datasets: [
            {
                data: Array.from(categorieMap.values()),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40',
                    '#E74C3C',
                    '#95A5A6',
                ],
            },
        ],
    };
}

/**
 * Helper: Aggregate by vendor
 */
function aggregateByVendor(transactions) {
    const vendorMap = new Map();

    transactions.forEach((transaction) => {
        const vendor = transaction.vendor_name || 'Unknown';
        const current = vendorMap.get(vendor) || 0;
        vendorMap.set(vendor, current + Number(transaction.amount_tokens));
    });

    const sorted = Array.from(vendorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    return {
        labels: sorted.map(([vendor]) => vendor),
        datasets: [
            {
                label: 'Spending by Vendor',
                data: sorted.map(([, amount]) => amount),
                backgroundColor: '#36A2EB',
            },
        ],
    };
}

/**
 * Helper: Calculate statistics
 */
function calculateStats(transactions) {
    if (transactions.length === 0) {
        return {
            total: 0,
            average: 0,
            highest: 0,
            count: 0,
        };
    }

    const amounts = transactions.map((transaction) => Number(transaction.amount_tokens));
    const total = amounts.reduce((sum, amt) => sum + amt, 0);

    return {
        total,
        average: (total / transactions.length).toFixed(2),
        highest: Math.max(...amounts),
        count: transactions.length,
    };
}

module.exports = AnalyticsController;
