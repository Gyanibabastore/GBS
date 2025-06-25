document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ JS Loaded and DOM Ready');

  const toggles = document.querySelectorAll('.deal-toggle');
  console.log(`🔍 Found ${toggles.length} toggles`);

  toggles.forEach((toggle) => {
    toggle.addEventListener('change', async () => {
      console.log('👉 Toggle changed');

      const i = toggle.dataset.index;
      const stockId = toggle.dataset.stockid;
      const returnAmount = parseFloat(toggle.dataset.return);
      const marginInput = document.getElementById(`margin-${i}`);
      const margin = parseFloat(marginInput?.value || 0);
      const bookingAmountSeller = returnAmount + margin;
      const deal = toggle.checked;

      // ✅ Check stock count from DOM
      const card = marginInput.closest('.card-body');
      const availableText = card.querySelector('.mb-3.text-muted').innerText;
      const availableCount = parseInt(availableText.split(':')[1]);

      if (deal && availableCount === 0) {
        alert('❌ Cannot activate deal — Stock is 0');
        toggle.checked = false; // revert switch visually
        return;
      }

      console.log(`🔁 Deal Toggle: ${deal}, Stock ID: ${stockId}, Margin: ${margin}, Final Price: ${bookingAmountSeller}`);

      try {
        const res = await fetch('/admin/deal/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stockId, deal, bookingAmountSeller }),
        });

        const data = await res.json();

        if (res.ok) {
          console.log('✅ Server responded:', data.message);
          window.location.reload();
        } else {
          console.error('❌ Server error:', data.error);
          alert(data.error || 'Toggle failed.');
        }
      } catch (err) {
        console.error('❌ Fetch error:', err);
        alert('Toggle failed. Try again.');
      }
      
    });
  });
  
  // Load More functionality
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  const productCards = document.querySelectorAll('.product-card');
  let visibleCount = 6;

  loadMoreBtn.addEventListener('click', () => {
    for (let i = visibleCount; i < visibleCount + 6; i++) {
      if (productCards[i]) {
        productCards[i].style.display = 'block';
      }
    }
    visibleCount += 6;

    // Hide button if all are shown
    if (visibleCount >= productCards.length) {
      loadMoreBtn.style.display = 'none';
    }
  });

});

