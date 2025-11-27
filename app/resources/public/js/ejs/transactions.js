async function showTransactionDetails(transactionId) {
    const modal = new bootstrap.Modal(document.getElementById('transactionModal'));
    const detailsEl = document.getElementById('transactionDetails');

    // Show loading spinner
    detailsEl.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;

    modal.show();

    try {
        const response = await fetch(`/api/transactions/${transactionId}`);

        if (!response.ok) {
            throw new Error('Failed to fetch transaction details');
        }

        const data = await response.json();

        detailsEl.innerHTML = `
            <div class="row g-3">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                        <span class="text-muted">Transaction ID</span>
                        <code>${data.uuid || data.id}</code>
                    </div>
                </div>
                
                <div class="col-6">
                    <small class="text-muted d-block">Type</small>
                    <strong class="text-capitalize">${data.type}</strong>
                </div>
                
                <div class="col-6">
                    <small class="text-muted d-block">Status</small>
                    <span class="badge bg-${data.status === 'completed' ? 'success' : data.status === 'pending' ? 'warning' : 'secondary'} text-capitalize">
                        ${data.status}
                    </span>
                </div>
                
                <div class="col-6">
                    <small class="text-muted d-block">Amount</small>
                    <strong class="fs-5">${data.amount_tokens.toLocaleString()} tokens</strong>
                </div>
                
                <div class="col-6">
                    <small class="text-muted d-block">Date & Time</small>
                    <strong>${new Date(data.timestamp).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}</strong>
                </div>
                
                ${
                    data.item_name
                        ? `
                    <div class="col-12">
                        <small class="text-muted d-block">Item</small>
                        <strong>${data.item_name}</strong>
                        ${data.item_category ? `<br><small class="text-muted"><i class="bi bi-tag me-1"></i>${data.item_category}</small>` : ''}
                    </div>
                `
                        : ''
                }
                
                ${
                    data.vendor_name
                        ? `
                    <div class="col-12">
                        <small class="text-muted d-block">Vendor</small>
                        <strong><i class="bi bi-shop me-1"></i>${data.vendor_name}</strong>
                    </div>
                `
                        : ''
                }
                
                ${
                    data.location || data.vendor_location
                        ? `
                    <div class="col-12">
                        <small class="text-muted d-block">Location</small>
                        <strong><i class="bi bi-geo-alt me-1"></i>${data.location || data.vendor_location}</strong>
                    </div>
                `
                        : ''
                }
                
                ${
                    data.description
                        ? `
                    <div class="col-12">
                        <small class="text-muted d-block">Description</small>
                        <p class="mb-0">${data.description}</p>
                    </div>
                `
                        : ''
                }
            </div>
        `;
    } catch (err) {
        console.error('Error loading transaction details:', err);
        detailsEl.innerHTML = `
            <div class="alert alert-danger mb-0">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Failed to load transaction details. Please try again.
            </div>
        `;
    }
}
