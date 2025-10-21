const checkoutBtn = document.getElementById('checkout-btn');
const qrImage = document.getElementById('qrcode-display');
const qrModal = new bootstrap.Modal(document.getElementById('paymentQRModal'));

checkoutBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  const transaction_id = '12345';

  try {
    const response = await fetch('/api/v1/qrcode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_id })
    });

    if (!response.ok) throw new Error('Failed to fetch QR code');

    const data = await response.json();
    qrImage.src = data.qrCodeDataUrl;
    qrModal.show();
  } catch (error) {
    console.error('Error fetching QR code:', error);
    alert('Something went wrong while generating the QR code.');
  }
});

