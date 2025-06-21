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
});
