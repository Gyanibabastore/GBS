document.addEventListener('DOMContentLoaded', () => {
  const dealForm = document.getElementById('dealForm');
  const buyerModal = document.getElementById('buyerModal');
  const triggerBuyerModal = document.getElementById('triggerBuyerModal');
  const closeBuyerModal = document.getElementById('closeBuyerModal');
  const cancelBuyerModal = document.getElementById('cancelBuyerModal');
  const buyerCheckboxes = document.querySelectorAll('.buyer-checkbox');
  const buyerInputs = document.querySelectorAll('.buyer-checkbox-input');
  const buyerQtyInputs = document.querySelectorAll('.buyer-qty-input');
  const selectAllCheckbox = document.getElementById('selectAllBuyers');
  const searchInput = document.getElementById('buyerSearch');
  const confirmBtn = document.getElementById('confirmCreateDeal');
  const selectedCount = document.getElementById('selectedCount');
  const sendToAllInput = document.getElementById('sendToAllInput');
  const selectAllQtyInput = document.getElementById('selectAllQtyInput');
  const spinner = document.getElementById('dealSpinner');
const bookingInput = document.getElementById("bookingAmount");
  const returnInput = document.getElementById("returnAmount");
  const marginInput = document.getElementById("margin");

  function updateMargin() {
    const booking = parseFloat(bookingInput.value);
    const returned = parseFloat(returnInput.value);

    if (!isNaN(booking) && !isNaN(returned)) {
      const margin = returned - booking;
      marginInput.value = margin >= 0 ? margin : 0;
    } else {
      marginInput.value = '';
    }
  }

  bookingInput.addEventListener("input", updateMargin);
  returnInput.addEventListener("input", updateMargin);

  let isSelectAllActive = false;

  triggerBuyerModal.addEventListener('click', () => {
    buyerModal.style.display = 'flex';
    buyerModal.classList.add('show');
    updateSelectionUI();
  });

  const hideModal = () => {
    buyerModal.classList.remove('show');
    buyerModal.style.display = 'none';
  };

  closeBuyerModal.addEventListener('click', hideModal);
  cancelBuyerModal.addEventListener('click', hideModal);
  buyerModal.addEventListener('click', (e) => {
    if (e.target === buyerModal) hideModal();
  });

  selectAllCheckbox.addEventListener('change', () => {
    isSelectAllActive = selectAllCheckbox.checked;
    buyerInputs.forEach(input => input.checked = isSelectAllActive);

    if (isSelectAllActive) {
      selectAllQtyInput.style.display = 'inline-block';
    } else {
      selectAllQtyInput.style.display = 'none';
      selectAllQtyInput.value = '';
    }

    updateSelectionUI();
  });

  buyerInputs.forEach(input => {
    input.addEventListener('change', () => {
      if (selectAllCheckbox.checked && !input.checked) {
        selectAllCheckbox.checked = false;
        isSelectAllActive = false;
      }
      updateSelectionUI();
    });
  });

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

searchInput.addEventListener('input', debounce(() => {
  const keyword = searchInput.value.toLowerCase();
  const buyerCheckboxes = document.querySelectorAll('.buyer-checkbox');

  buyerCheckboxes.forEach(div => {
    const label = div.innerText.toLowerCase();
    div.style.display = label.includes(keyword) ? 'flex' : 'none';
  });
}, 200));



  function updateSelectionUI() {
    let count = 0;
    buyerCheckboxes.forEach(div => {
      const input = div.querySelector('input[type="checkbox"]');
      if (input.checked) {
        div.classList.add('selected');
        count++;
      } else {
        div.classList.remove('selected');
      }
    });
    selectedCount.innerText = `Selected: ${count} buyer${count === 1 ? '' : 's'}`;
  }

  confirmBtn.addEventListener('click', () => {
    // Clear previous hidden inputs
    document.querySelectorAll('.hidden-buyer-input').forEach(inp => inp.remove());

    // Set flag
    sendToAllInput.value = isSelectAllActive ? 'true' : 'false';

    if (isSelectAllActive) {
      const qty = parseInt(selectAllQtyInput.value);
      if (isNaN(qty) || qty <= 0) {
        alert('❌ Please enter a valid quantity for all buyers.');
        return;
      }

      const qtyInput = document.createElement('input');
      qtyInput.type = 'hidden';
      qtyInput.name = 'allBuyerQty';
      qtyInput.value = qty;
      qtyInput.classList.add('hidden-buyer-input');
      dealForm.appendChild(qtyInput);
    } else {
      const selectedBuyers = [];

      for (let i = 0; i < buyerInputs.length; i++) {
        const checkbox = buyerInputs[i];
        const qtyField = buyerQtyInputs[i];

        if (checkbox.checked) {
          const buyerId = checkbox.value;
          const qty = parseInt(qtyField.value);

          if (isNaN(qty) || qty <= 0) {
            alert(`❌ Please enter valid quantity for selected buyer.`);
            return;
          }

          selectedBuyers.push({ buyerId, qty });
        }
      }

      if (selectedBuyers.length === 0) {
        alert("❌ Please select at least one buyer.");
        return;
      }

   selectedBuyers.forEach(({ buyerId, qty }) => {
  const idInput = document.createElement('input');
  idInput.type = 'hidden';
  idInput.name = 'buyerIds[]'; // ✅ Make this an array
  idInput.value = buyerId;
  idInput.classList.add('hidden-buyer-input');

  const qtyInput = document.createElement('input');
  qtyInput.type = 'hidden';
  qtyInput.name = 'buyerQuantities[]'; // ✅ Make this an array
  qtyInput.value = qty;
  qtyInput.classList.add('hidden-buyer-input');

  dealForm.appendChild(idInput);
  dealForm.appendChild(qtyInput);
});

    }

    // ✅ Show spinner before submitting
    if (spinner) spinner.style.display = 'flex';

    dealForm.submit();
  });

  // ✅ Toggle Handling for status switches
  const toggleSwitches = document.querySelectorAll('.toggle-status');
  toggleSwitches.forEach(toggle => {
    toggle.addEventListener('change', async () => {
      const dealId = toggle.getAttribute('data-id');
      const quantityAttr = toggle.getAttribute('data-quantity');
      const quantity = quantityAttr === '-1' ? 'unlimited' : parseInt(quantityAttr);

      if (toggle.checked && quantity !== 'unlimited' && quantity === 0) {
        const qtyToAdd = prompt('⚠ Quantity is 0. Please enter quantity to enable this deal:');
        const qtyNum = parseInt(qtyToAdd);
        if (isNaN(qtyNum) || qtyNum <= 0) {
          alert('❌ Invalid quantity entered. Deal not activated.');
          toggle.checked = false;
          return;
        }

        try {
          const res = await fetch(`/admin/deals/toggle/${dealId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantityToAdd: qtyNum })
          });
          const data = await res.json();
          if (data.success) {
            toggle.nextElementSibling.innerText = '🟢 Active';
            alert('✅ Quantity added and deal activated.');
          } else {
            alert(data.message || '❌ Failed to activate deal.');
            toggle.checked = false;
          }
        } catch (err) {
          console.error('❌ Toggle error:', err);
          alert('Server error.');
          toggle.checked = false;
        }

        return;
      }

      try {
        const res = await fetch(`/admin/deals/toggle/${dealId}`, {
          method: 'POST'
        });
        const data = await res.json();
        if (data.success) {
          alert('✅ Status updated.');
          location.reload();
        } else {
          alert(data.message || '❌ Failed to update deal status.');
          toggle.checked = !toggle.checked;
        }
      } catch (err) {
        console.error('❌ Toggle status error:', err);
        alert('Server error.');
        toggle.checked = !toggle.checked;
      }
    });
  });
});
