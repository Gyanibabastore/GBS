document.addEventListener('DOMContentLoaded', () => {
  const deliveryCards = document.querySelectorAll('.delivery-card');
  const floatingModal = document.getElementById('floatingModal');
  const verifyBody = document.getElementById('verifyBody');
  const confirmBtn = document.getElementById('confirmDelivery');
  const cancelBtn = document.getElementById('cancelFloating');

  let currentDeliveryId = null;
  let currentToggle = null;
  let currentCard = null;

  deliveryCards.forEach((card) => {
    const toggle = card.querySelector('.delivery-toggle');
    if (!toggle || toggle.disabled) return;

    toggle.addEventListener('click', (e) => {
      e.preventDefault();

      currentDeliveryId = card.getAttribute('data-id');
      currentToggle = toggle;
      currentCard = card;

      toggle.checked = false;

      // Modal content
      verifyBody.innerHTML = `
        <p><strong>Name:</strong> ${card.getAttribute('data-buyer')}</p>
        <p><strong>Tracking ID:</strong> ${card.getAttribute('data-tracking')}</p>
        <p><strong>Model:</strong> ${card.getAttribute('data-brand')} ${card.getAttribute('data-model')} ${card.getAttribute('data-variant')} ${card.getAttribute('data-color')}</p>
        <p><strong>Pincode:</strong> ${card.getAttribute('data-pincode')}</p>
        <p class="text-danger">Are you sure you want to mark this order as <strong>Delivered</strong>?</p>
        <p class="text-warning">⚠️ This action is <strong>irreversible</strong>.</p>
      `;

      // Get position
      const rect = toggle.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      floatingModal.style.top = `${rect.top + scrollTop + 30}px`; // show slightly below
      floatingModal.style.left = `${rect.left}px`;
      floatingModal.style.display = 'block';
    });
  });

  cancelBtn.addEventListener('click', () => {
    floatingModal.style.display = 'none';
  });

  confirmBtn.addEventListener('click', async () => {
    floatingModal.style.display = 'none';

    const finalConfirm = confirm("⚠️ You won't be able to undo this. Confirm to proceed?");
    if (!finalConfirm) return;

    try {
      const res = await fetch('/admin/ofd/delivered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentDeliveryId })
      });

      const data = await res.json();

      if (res.ok) {
        currentToggle.checked = true;
        currentToggle.disabled = true;
        currentCard.classList.add('bg-light', 'disabled-card');
        alert("✅ Order successfully marked as delivered");
        location.reload();
      } else {
        alert(data.message || '❌ Failed to mark as delivered');
      }
    } catch (err) {
      console.error('Error marking delivery:', err);
      alert("🚨 Server error while marking delivered.");
    }
  });
});
