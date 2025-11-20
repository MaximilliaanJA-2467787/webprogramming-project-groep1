document.addEventListener('DOMContentLoaded', function () {
    // Data wordt doorgegeven vanuit de EJS template via data-attributes
    const spendingChartEl = document.getElementById('spendingChart');
    const categoryChartEl = document.getElementById('categoryChart');
    const vendorChartEl = document.getElementById('vendorChart');

    // Parse data from data attributes (set by EJS)
    const spendingData = spendingChartEl
        ? JSON.parse(spendingChartEl.dataset.chartData || 'null')
        : null;
    const categoryData = categoryChartEl
        ? JSON.parse(categoryChartEl.dataset.chartData || 'null')
        : null;
    const vendorData = vendorChartEl ? JSON.parse(vendorChartEl.dataset.chartData || 'null') : null;

    // Spending Over Time Chart
    if (spendingChartEl && spendingData) {
        new Chart(spendingChartEl, {
            type: 'line',
            data: spendingData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return 'Spent: ' + context.parsed.y + ' tokens';
                            },
                        },
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return value + ' tok';
                            },
                        },
                    },
                },
            },
        });
    }

    // Category Pie Chart
    if (categoryChartEl && categoryData && categoryData.labels.length > 0) {
        new Chart(categoryChartEl, {
            type: 'doughnut',
            data: categoryData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return (
                                    context.label +
                                    ': ' +
                                    context.parsed +
                                    ' tok (' +
                                    percentage +
                                    '%)'
                                );
                            },
                        },
                    },
                },
            },
        });
    }

    // Vendor Bar Chart
    if (vendorChartEl && vendorData && vendorData.labels.length > 0) {
        new Chart(vendorChartEl, {
            type: 'bar',
            data: vendorData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return 'Spent: ' + context.parsed.x + ' tokens';
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return value + ' tok';
                            },
                        },
                    },
                },
            },
        });
    }
});
