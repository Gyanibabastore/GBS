document.addEventListener('DOMContentLoaded', () => {
  try {
    const deliveryCards = document.querySelectorAll('.delivery-card');
    const verifyModal = new bootstrap.Modal(document.getElementById('verifyModal'));
    const verifyBody = document.getElementById('verifyBody');
    const confirmBtn = document.getElementById('confirmDelivery');

    if (!deliveryCards || !verifyModal || !verifyBody || !confirmBtn) {
      throw new Error("Required DOM elements missing for delivery modal.");
    }

    let currentDeliveryId = null;

    deliveryCards.forEach((card) => {
      try {
        const toggle = card.querySelector('.delivery-toggle');
        if (!toggle) return;

        // Skip already marked as delivered
        if (toggle.disabled) return;

        toggle.addEventListener('change', (e) => {
          try {
            if (e.target.checked) {
              currentDeliveryId = card.getAttribute('data-id');
              verifyBody.innerHTML = `
                <p><strong>Buyer:</strong> ${card.getAttribute('data-buyer')}</p>
                <p><strong>Tracking ID:</strong> ${card.getAttribute('data-tracking')}</p>
                <p>Are you sure you want to mark this order as <strong>delivered</strong>?</p>
              `;
              e.target.checked = false; // Reset until confirmed
              verifyModal.show();
            }
          } catch (innerErr) {
            console.error("⚠️ Toggle handler error:", innerErr);
            alert("Something went wrong while opening delivery confirmation.");
          }
        });
      } catch (cardErr) {
        console.error("📦 Card setup error:", cardErr);
      }
    });

    confirmBtn.addEventListener('click', () => {
      try {
        if (!currentDeliveryId) {
          alert("No delivery selected.");
          return;
        }

        fetch('/admin/ofd/delivered', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
          },
          body: JSON.stringify({ id: currentDeliveryId })
        })
        .then(async (res) => {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();

            if (data.message?.toLowerCase().includes('marked as delivered')) {
              const card = document.querySelector(`.delivery-card[data-id="${currentDeliveryId}"]`);
              if (card) {
                const toggle = card.querySelector('.delivery-toggle');
                toggle.checked = true;
                toggle.disabled = true;
                card.classList.add('disabled-card');
              }

              const deliveredCountElem = document.getElementById('deliveredCount');
              const pendingCountElem = document.getElementById('pendingCount');

              if (deliveredCountElem && pendingCountElem) {
                deliveredCountElem.textContent = parseInt(deliveredCountElem.textContent || '0') + 1;
                pendingCountElem.textContent = parseInt(pendingCountElem.textContent || '0') - 1;
              }

              currentDeliveryId = null;
              verifyModal.hide();
            } else {
              alert(data.message || 'Unable to mark as delivered.');
            }
          } else {
            throw new Error('Invalid response format from server');
          }
        })
        .catch(err => {
          console.error("🔥 Server fetch error:", err);
          alert("Server error occurred while marking as delivered.");
        });

      } catch (confirmErr) {
        console.error("🔴 Confirm button error:", confirmErr);
        alert("Something went wrong during confirmation.");
      }
    });

  } catch (mainErr) {
    console.error("🧨 Delivery script failed to initialize:", mainErr);
    alert("Critical error loading delivery page. Please refresh.");
  }
});
