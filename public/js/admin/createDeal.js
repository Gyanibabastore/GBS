document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.toggle-status').forEach(toggle => {
    toggle.addEventListener('change', async (e) => {
      const dealId = e.target.dataset.id;

      try {
        const res = await fetch(`/admin/deals/toggle/${dealId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        if (data.success) {
          alert(`Deal status updated to: ${data.newStatus}`);
          location.reload();
        } else {
          alert('Failed to update status');
        }
      } catch (err) {
        console.error(err);
        alert('Error toggling status');
      }
    });
  });
});
