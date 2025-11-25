/**
 * Navigation function for period switching
 */
function navigatePeriod(direction) {
    const urlParams = new URLSearchParams(window.location.search);
    const currentPeriod = urlParams.get('period') || 'month';
    const currentOffset = parseInt(urlParams.get('offset') || '0', 10);
    const newOffset = currentOffset + direction;

    window.location.href = `/analytics?period=${currentPeriod}&offset=${newOffset}`;
}

/**
 * Color palette voor consistente styling
 */
const colorPalette = {
    primary: '#007bff',
    primaryLight: 'rgba(0, 123, 255, 0.1)',
    primaryGradient: {
        start: 'rgba(0, 123, 255, 0.8)',
        end: 'rgba(0, 123, 255, 0.2)',
    },
    categories: [
        '#28a745',
        '#ffc107',
        '#dc3545',
        '#6f42c1',
        '#fd7e14',
        '#20c997',
        '#6610f2',
        '#e83e8c',
        '#17a2b8',
    ],
};

/**
 * Show daily breakdown modal
 */
function showDayBreakdown(date, transactions) {
    let modal = document.getElementById('dayBreakdownModal');

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'dayBreakdownModal';
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-calendar-day me-2"></i>
                            <span id="modalDate"></span>
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="modalBody" style="max-height: 70vh; overflow-y: auto;"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById('modalDate').textContent = new Date(date).toLocaleDateString('nl-NL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const modalBody = document.getElementById('modalBody');
    if (!transactions || transactions.length === 0) {
        modalBody.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-inbox text-muted" style="font-size:3rem;"></i>
                <p class="text-muted mt-3 mb-0">No transactions on this day</p>
            </div>
        `;
    } else {
        const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount_tokens, 0);
        modalBody.innerHTML = `
            <div class="alert alert-info d-flex align-items-center mb-3">
                <i class="bi bi-info-circle fs-4 me-3"></i>
                <div>
                    <strong>${transactions.length}</strong> transaction${transactions.length > 1 ? 's' : ''} • 
                    Total: <strong>${totalSpent.toLocaleString()}</strong> tokens
                </div>
            </div>
            <div class="list-group">
                ${transactions
                    .map(
                        (tx) => `
                    <div class="list-group-item py-2 border-bottom">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1 fw-bold">${tx.item_name || 'Purchase'}</h6>
                                <small class="text-muted d-block">
                                    <i class="bi bi-shop me-1"></i>${tx.vendor_name || 'Unknown vendor'}
                                    ${tx.category_name ? `<i class="bi bi-tag ms-2 me-1"></i>${tx.category_name}` : ''}
                                </small>
                                <small class="text-muted d-block mt-1">
                                    <i class="bi bi-clock me-1"></i>${new Date(tx.timestamp).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                                </small>
                            </div>
                            <span class="badge bg-danger ms-3 align-self-start">-${tx.amount_tokens.toLocaleString()} tok</span>
                        </div>
                    </div>
                `
                    )
                    .join('')}
            </div>
        `;
    }

    const bsModal = bootstrap.Modal.getInstance(modal) || new bootstrap.Modal(modal);

    window.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            bsModal.hide();
            document.body.classList.remove('modal-open');
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
        }
    });

    modal.addEventListener(
        'hidden.bs.modal',
        () => {
            document.body.classList.remove('modal-open');
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
        },
        { once: true }
    );
}

/**
 * gives month transaction view
 */
function showMonthBreakdown(month, transactions) {
    const modalDate = document.getElementById('modalDate');
    const modalBody = document.getElementById('modalBody');

    if (modalDate) {
        modalDate.innerText = `Transacties in ${month}`;
    }

    if (!transactions || transactions.length === 0) {
        modalBody.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-inbox text-muted" style="font-size:3rem;"></i>
                <p class="text-muted mt-3 mb-0">Geen transacties gevonden.</p>
            </div>
        `;
        return;
    }

    const totalSpent = transactions.reduce((sum, t) => sum + t.amount_tokens, 0);

    modalBody.innerHTML = `
        <div class="alert alert-info d-flex align-items-center mb-3">
            <i class="bi bi-info-circle fs-4 me-3"></i>
            <div>
                <strong>${transactions.length}</strong> transaction${transactions.length > 1 ? 's' : ''} • 
                Total: <strong>${totalSpent.toLocaleString()}</strong> tokens
            </div>
        </div>
        <div class="list-group" style="max-height:70vh; overflow-y:auto;">
            ${transactions
                .map(
                    (t) => `
                <div class="list-group-item py-2 border-bottom">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="mb-1 fw-bold">${t.item_name || t.category || 'Purchase'}</h6>
                            <small class="text-muted d-block">
                                ${t.vendor_name ? `<i class="bi bi-shop me-1"></i>${t.vendor_name}` : ''}
                                ${t.category_name ? `<i class="bi bi-tag ms-2 me-1"></i>${t.category_name}` : ''}
                            </small>
                            <small class="text-muted d-block mt-1">
                                ${t.timestamp ? `<i class="bi bi-clock me-1"></i>${new Date(t.timestamp).toLocaleDateString('nl-NL')} ` : ''}
                            </small>
                        </div>
                        <span class="badge bg-danger ms-3 align-self-start">-${t.amount_tokens.toLocaleString()} tok</span>
                    </div>
                </div>
            `
                )
                .join('')}
        </div>
    `;

    let modal = document.getElementById('dayBreakdownModal');
    const bsModal = bootstrap.Modal.getInstance(modal) || new bootstrap.Modal(modal);

    window.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            bsModal.hide();
            document.body.classList.remove('modal-open');
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
        }
    });
}

/**
 * Initialize all charts
 */
function initializeCharts(spendingData, categoryData, vendorData) {
    const spendingCtx = document.getElementById('spendingChart');
    if (spendingCtx && spendingData) {
        // Gradient maken
        const ctx = spendingCtx.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, colorPalette.primaryGradient.start);
        gradient.addColorStop(1, colorPalette.primaryGradient.end);

        const spendingChart = new Chart(spendingCtx, {
            type: 'bar',
            data: {
                labels: spendingData.labels,
                datasets: [
                    {
                        label: 'Spent',
                        data: spendingData.datasets[0].data,
                        backgroundColor: gradient,
                        borderColor: colorPalette.primary,
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false,
                        hoverBackgroundColor: colorPalette.primary,
                        hoverBorderColor: colorPalette.primary,
                        hoverBorderWidth: 3,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        titleFont: {
                            size: 14,
                            weight: 'bold',
                        },
                        bodyFont: {
                            size: 13,
                        },
                        callbacks: {
                            label: function (context) {
                                return 'Spent: ' + context.parsed.y.toLocaleString() + ' tokens';
                            },
                            afterLabel: function (context) {
                                return 'Click to see details';
                            },
                        },
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false,
                        },
                        ticks: {
                            padding: 10,
                            font: {
                                size: 12,
                            },
                            callback: function (value) {
                                return value.toLocaleString() + ' tok';
                            },
                        },
                    },
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false,
                        },
                        ticks: {
                            padding: 10,
                            font: {
                                size: 12,
                            },
                        },
                    },
                },
                animation: {
                    duration: 750,
                    easing: 'easeInOutQuart',
                },
                onClick: async (event, activeElements) => {
                    if (activeElements.length > 0) {
                        const index = activeElements[0].index;
                        const date =
                            (spendingData.dates && spendingData.dates[index]) ||
                            spendingData.labels[index];

                        if (!date) {
                            console.error('No date found for index', index, spendingData);
                            return;
                        }

                        // Show loading state first
                        let modal = document.getElementById('dayBreakdownModal');
                        if (!modal) {
                            modal = document.createElement('div');
                            modal.id = 'dayBreakdownModal';
                            modal.className = 'modal fade';
                            modal.innerHTML = `
                                <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                                    <div class="modal-content">
                                        <div class="modal-header bg-primary text-white">
                                            <h5 class="modal-title">
                                                <i class="bi bi-calendar-day me-2"></i>
                                                <span id="modalDate"></span>
                                            </h5>
                                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                                        </div>
                                        <div class="modal-body" id="modalBody">
                                            <!-- Content will be inserted here -->
                                        </div>
                                    </div>
                                </div>
                            `;
                            document.body.appendChild(modal);
                        }

                        const modalBody = document.getElementById('modalBody');
                        if (modalBody) {
                            modalBody.innerHTML =
                                '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>';
                        }

                        // Show modal immediately
                        const bsModal = new bootstrap.Modal(modal);
                        bsModal.show();

                        // Check if it's a month format
                        const monthISORegex = /^\d{4}-\d{2}$/; // Matches "2025-10"
                        const monthLabelRegex = /^[A-Za-z]{3,9} \d{4}$/; // Matches "Jan 2025"

                        if (monthISORegex.test(date)) {
                            // It's a month in ISO format
                            const [year, month] = date.split('-');
                            const monthName = new Date(year, month - 1).toLocaleDateString(
                                'en-US',
                                { month: 'long', year: 'numeric' }
                            );

                            document.getElementById('modalDate').textContent = monthName;

                            try {
                                const response = await fetch(
                                    `/api/transactions/by-month?year=${year}&month=${month}`
                                );
                                const data = await response.json();
                                showMonthBreakdown(monthName, data.transactions || []);
                            } catch (error) {
                                console.error('Error fetching month transactions:', error);
                                showMonthBreakdown(monthName, []);
                            }
                        } else if (monthLabelRegex.test(date)) {
                            // It's a month
                            const [monthName, year] = date.split(' ');
                            const month = (new Date(`${monthName} 1, ${year}`).getMonth() + 1)
                                .toString()
                                .padStart(2, '0');

                            document.getElementById('modalDate').textContent =
                                `${monthName} ${year}`;

                            try {
                                const response = await fetch(
                                    `/api/transactions/by-month?year=${year}&month=${month}`
                                );
                                const data = await response.json();
                                showMonthBreakdown(`${monthName} ${year}`, data.transactions || []);
                            } catch (error) {
                                console.error('Error fetching month transactions:', error);
                                showMonthBreakdown(`${monthName} ${year}`, []);
                            }
                        } else {
                            // It's a day
                            try {
                                const response = await fetch(
                                    `/api/transactions/by-date?date=${date}`
                                );
                                const data = await response.json();
                                showDayBreakdown(date, data.transactions || []);
                            } catch (error) {
                                console.error('Error fetching transactions:', error);
                                showDayBreakdown(date, []);
                            }
                        }
                    }
                },
            },
        });

        // Change cursor on hover
        spendingCtx.style.cursor = 'pointer';
    }

    // Category Pie Chart - Verbeterde Doughnut Chart
    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx && categoryData && categoryData.labels.length > 0) {
        new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: categoryData.labels,
                datasets: [
                    {
                        data: categoryData.datasets[0].data,
                        backgroundColor: colorPalette.categories,
                        borderColor: '#ffffff',
                        borderWidth: 3,
                        hoverBorderWidth: 4,
                        hoverOffset: 15,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12,
                            },
                            usePointStyle: true,
                            pointStyle: 'circle',
                        },
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        titleFont: {
                            size: 14,
                            weight: 'bold',
                        },
                        bodyFont: {
                            size: 13,
                        },
                        callbacks: {
                            label: function (context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return (
                                    context.label +
                                    ': ' +
                                    context.parsed.toLocaleString() +
                                    ' tok (' +
                                    percentage +
                                    '%)'
                                );
                            },
                        },
                    },
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1000,
                    easing: 'easeInOutQuart',
                },
            },
        });
    }

    // Vendor Bar Chart - Horizontale Bar Chart
    const vendorCtx = document.getElementById('vendorChart');
    if (vendorCtx && vendorData && vendorData.labels.length > 0) {
        new Chart(vendorCtx, {
            type: 'bar',
            data: {
                labels: vendorData.labels,
                datasets: [
                    {
                        label: 'Spent',
                        data: vendorData.datasets[0].data,
                        backgroundColor: colorPalette.categories.slice(0, vendorData.labels.length),
                        borderRadius: 6,
                        borderSkipped: false,
                        hoverBackgroundColor: colorPalette.primary,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        titleFont: {
                            size: 14,
                            weight: 'bold',
                        },
                        bodyFont: {
                            size: 13,
                        },
                        callbacks: {
                            label: function (context) {
                                return 'Spent: ' + context.parsed.x.toLocaleString() + ' tokens';
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false,
                        },
                        ticks: {
                            padding: 10,
                            font: {
                                size: 12,
                            },
                            callback: function (value) {
                                return value.toLocaleString() + ' tok';
                            },
                        },
                    },
                    y: {
                        grid: {
                            display: false,
                            drawBorder: false,
                        },
                        ticks: {
                            padding: 10,
                            font: {
                                size: 12,
                            },
                        },
                    },
                },
                animation: {
                    duration: 750,
                    easing: 'easeInOutQuart',
                },
            },
        });
    }
}

/**
 * Setup keyboard navigation
 */
function setupKeyboardNavigation(period, canGoNext) {
    document.addEventListener('keydown', function (e) {
        if (period === 'alltime') return;

        if (e.key === 'ArrowLeft') {
            navigatePeriod(-1);
        } else if (e.key === 'ArrowRight' && canGoNext) {
            navigatePeriod(1);
        }
    });
}

/**
 * Main initialization
 */
document.addEventListener('DOMContentLoaded', function () {
    // Get data from window object (set by EJS)
    const spendingData = window.analyticsData?.spending;
    const categoryData = window.analyticsData?.category;
    const vendorData = window.analyticsData?.vendor;
    const period = window.analyticsData?.period;
    const canGoNext = window.analyticsData?.canGoNext;

    if (spendingData || categoryData || vendorData) {
        initializeCharts(spendingData, categoryData, vendorData);
    }

    if (period) {
        setupKeyboardNavigation(period, canGoNext);
    }
});
