document.addEventListener('DOMContentLoaded', () => {
  const filterDate = document.getElementById('filterDate');
  const filterMonth = document.getElementById('filterMonth');
  const resetBtn = document.getElementById('resetFilter');

  function applyFilter() {
    const params = new URLSearchParams();
    if (filterDate.value) params.append('filterDate', filterDate.value);
    if (filterMonth.value) params.append('filterMonth', filterMonth.value);
    params.append('mode', 'json'); // for backend JSON response

fetch(`/admin/payments?${params.toString()}`)

      .then(res => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log("✅ Filtered Seller Payments Received:", data);
        renderPayments(data);
      })
      .catch(err => console.error('❌ Error fetching seller payments:', err));
  }

  function renderPayments({ totalAdvance, payments }) {
    const row = document.querySelector('.row.g-4');
    const totalDiv = document.querySelector('.card-body h3');

    // Update total advance amount
    totalDiv.textContent = `₹${totalAdvance.toLocaleString()}`;

    // Clear old cards
    row.innerHTML = '';

    if (!payments.length) {
      row.innerHTML = `
        <div class="col-12">
          <div class="alert alert-info text-center">No payments found for this filter.</div>
        </div>
      `;
      return;
    }

    // Render seller payment cards
    payments.forEach(payment => {
      const card = document.createElement('div');
      card.className = 'col-md-6 col-lg-4';
      card.innerHTML = `
        <div class="card h-100 shadow-sm">
          <img src="${payment.proofImg}" class="card-img-top" style="height: 200px; object-fit: cover;" alt="Proof Image">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title mb-2">👨‍💼 Seller: ${payment.name}</h5>
            <p class="card-text mb-1">📞 Phone: ${payment.phone}</p>
            <p class="card-text mb-1">💰 Amount: ₹${payment.amount.toLocaleString()}</p>
            <p class="card-text mb-1">💳 Mode: ${payment.mode}</p>
            <p class="card-text mb-1">📅 Date: ${payment.date}</p>
          </div>
        </div>
      `;
      row.appendChild(card);
    });
  }

  // Apply filter on change
  filterDate.addEventListener('change', applyFilter);
  filterMonth.addEventListener('change', applyFilter);

  // Reset filter
  resetBtn.addEventListener('click', () => {
    filterDate.value = '';
    filterMonth.value = '';
    applyFilter();
  });
});
