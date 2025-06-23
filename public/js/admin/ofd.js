document.addEventListener('DOMContentLoaded', () => {
  const deliveryCards = document.querySelectorAll('.delivery-card');
  const verifyModalEl = document.getElementById('verifyModal');
  const verifyModal = new bootstrap.Modal(verifyModalEl);
  const verifyBody = document.getElementById('verifyBody');
  const confirmBtn = document.getElementById('confirmDelivery');

  let currentDeliveryId = null;
  let currentToggle = null;
  let currentCard = null;

  deliveryCards.forEach((card) => {
    const toggle = card.querySelector('.delivery-toggle');
    if (!toggle || toggle.disabled) return;

    toggle.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent auto toggle
      currentDeliveryId = card.getAttribute('data-id');
      currentToggle = toggle;
      currentCard = card;

      // Reset toggle to unchecked
      toggle.checked = false;

      verifyBody.innerHTML = `
        <p><strong>Buyer:</strong> ${card.getAttribute('data-buyer')}</p>
        <p><strong>Tracking ID:</strong> ${card.getAttribute('data-tracking')}</p>
        <p class="text-danger">Are you sure you want to mark this order as <strong>Delivered</strong>?</p>
        <p class="text-warning">⚠️ This action is <strong>irreversible</strong>.</p>
      `;
      verifyModal.show();
    });
  });

  confirmBtn.addEventListener('click', async () => {
    verifyModal.hide();

    const finalConfirm = confirm("⚠️ You won't be able to undo this. Confirm to proceed?");
    if (!finalConfirm) return;

    try {
      const res = await fetch('/admin/ofd/delivered', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: currentDeliveryId })
      });

      const data = await res.json();

      if (res.ok) {
        // UI update
        currentToggle.checked = true;
        currentToggle.disabled = true;
        currentCard.classList.add('bg-light', 'disabled-card');
        alert("✅ Order successfully marked as delivered");
        location.reload(); // Optional to update counts
      } else {
        alert(data.message || '❌ Failed to mark as delivered');
      }

    } catch (err) {
      console.error('Error marking delivery:', err);
      alert("🚨 Server error while marking delivered.");
    }
  });
});
