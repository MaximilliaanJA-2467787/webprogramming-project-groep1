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
            // Logger.debug(`Analytics requested for user ${userId}`);

            const wallet = await walletModel.getByUserId(userId);
            if (!wallet) {
                Logger.error('Error in Analytics show: wallet not found');
                return error(res, 404);
            }

            // get period and offset
            const period = req.query.period || 'month';
            const offset = parseInt(req.query.offset || '0', 10);

            let firstTransactionDate = null;
            if (period === 'alltime') {
                const firstTransaction = await transactionModel.getTransactionByUserId(userId, {
                    status: 'completed',
                    type: 'purchase',
                    orderBy: 'timestamp',
                    orderDir: 'ASC',
                    limit: 1,
                });
                if (firstTransaction && firstTransaction.length > 0) {
                    firstTransactionDate = firstTransaction[0].timestamp;
                }
            }

            // Calculate date range based on period and offset
            const { startDate, endDate, groupBy, displayName, canGoNext } = getDateRange(
                period,
                offset,
                firstTransactionDate
            );

            /** Logger.debug(
                `Period: ${period}, Start: ${startDate}, End: ${endDate}, GroupBy: ${groupBy}`
            ); */

            // get all needed transactions
            const transactions = await transactionModel.getTransactionByUserId(userId, {
                status: 'completed',
                type: 'purchase',
                since: startDate,
                until: endDate,
                orderBy: 'timestamp',
                orderDir: 'ASC',
            });
            // Logger.debug('got all needed transactions')

            //aggregate data for charts
            const aggregatedData = aggregateTransactions(transactions, groupBy, startDate, endDate);
            // Logger.debug('Aggregated time data successfully');

            const categoryData = aggregateByCategory(transactions);
            // Logger.debug('Aggregated category data successfully');

            const vendorData = aggregateByVendor(transactions);
            // Logger.debug('Aggregated vendor data successfully');

            const stats = calculateStats(transactions);
            // Logger.debug('Calculated stats successfully');

            return res.render('pages/user/analytics', {
                layout: 'layouts/default-layout',
                title: 'Spending Analytics - CashLess',
                user: req.session.user,
                wallet,
                period,
                offset,
                displayName,
                canGoNext,
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
function getDateRange(period, offset = 0, firstTransactionDate = null) {
    const now = new Date();
    let startDate, endDate, groupBy, displayName, canGoNext;

    canGoNext = offset < 0;

    switch (period) {
        case 'week':
            groupBy = 'day';

            // get current monday
            const currentMonday = new Date(now);
            const dayOfWeek = currentMonday.getDay();
            const diff = dayOfWeek === 0 ? -5 : 1 - dayOfWeek;
            currentMonday.setDate(currentMonday.getDate() + diff);
            currentMonday.setHours(0, 0, 0, 0);

            // apply offset
            const targetMonday = new Date(currentMonday);
            targetMonday.setDate(targetMonday.getDate() + offset * 7);

            // set start/end dates
            startDate = new Date(targetMonday);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(targetMonday);
            endDate.setDate(endDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);

            // Format display name
            const weekStart = startDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            });
            const weekEnd = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (offset === 0) {
                displayName = `This Week (${weekStart} - ${weekEnd})`;
            } else if (offset === -1) {
                displayName = `Last Week (${weekStart} - ${weekEnd})`;
            } else {
                displayName = `Week of ${weekStart}`;
            }
            break;

        case 'month':
            const targetDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);

            startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);

            groupBy = 'day';

            // Format display name
            const monthName = targetDate.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
            });
            if (offset === 0) {
                displayName = `This Month (${monthName})`;
            } else if (offset === -1) {
                displayName = `Last Month (${monthName})`;
            } else {
                displayName = monthName;
            }
            break;

        case 'year':
            const targetYear = now.getFullYear() + offset;

            startDate = new Date(targetYear, 0, 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(targetYear, 11, 31);
            endDate.setHours(23, 59, 59, 999);
            groupBy = 'month';

            if (offset === 0) {
                displayName = `This Year (${targetYear})`;
            } else if (offset === -1) {
                displayName = `Last Year (${targetYear})`;
            } else {
                displayName = `Year ${targetYear}`;
            }
            break;

        case 'alltime':
        default:
            if (firstTransactionDate) {
                startDate = new Date(firstTransactionDate);
                startDate.setHours(0, 0, 0, 0);

                const firstYear = startDate.getFullYear();
                const currentYear = now.getFullYear();
                displayName =
                    firstYear === currentYear
                        ? 'All Time (since this year)'
                        : `All Time (since ${firstYear})`;
            } else {
                startDate = new Date(0);
                startDate.setHours(0, 0, 0, 0);
                displayName = 'All time';
            }
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);

            groupBy = 'month';
            canGoNext = false;
            break;
    }

    return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        groupBy,
        displayName,
        canGoNext,
    };
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
        for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
            const key = d.toISOString().split('T')[0];
            dataMap.set(key, 0);
        }
    } else if (groupBy === 'month') {
        for (
            let d = new Date(start);
            d <= end;
            d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
        ) {
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const key = `${d.getFullYear()}-${month}`;
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
        dates: Array.from(dataMap.keys()),
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
    const categoryMap = new Map();

    transactions.forEach((transaction) => {
        const category = transaction.item_category || 'Other';
        const current = categoryMap.get(category) || 0;
        categoryMap.set(category, current + Number(transaction.amount_tokens));
    });

    return {
        labels: Array.from(categoryMap.keys()),
        datasets: [
            {
                data: Array.from(categoryMap.values()),
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
