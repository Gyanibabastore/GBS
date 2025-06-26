document.addEventListener('DOMContentLoaded', () => {
  const dealForm = document.getElementById('dealForm');
  const buyerModal = document.getElementById('buyerModal');
  const triggerBuyerModal = document.getElementById('triggerBuyerModal');
  const closeBuyerModal = document.getElementById('closeBuyerModal');
  const cancelBuyerModal = document.getElementById('cancelBuyerModal');
  const buyerCheckboxes = document.querySelectorAll('.buyer-checkbox');
  const buyerInputs = document.querySelectorAll('.buyer-checkbox-input');
<<<<<<< HEAD
  const buyerQtyInputs = document.querySelectorAll('.buyer-qty-input');
=======
>>>>>>> cd573ee12ea5d10772ada60cf09242d9dc9b026e
  const selectAllCheckbox = document.getElementById('selectAllBuyers');
  const searchInput = document.getElementById('buyerSearch');
  const confirmBtn = document.getElementById('confirmCreateDeal');
  const selectedCount = document.getElementById('selectedCount');
  const sendToAllInput = document.getElementById('sendToAllInput');
<<<<<<< HEAD
const selectAllQtyInput = document.getElementById('selectAllQtyInput');
=======

  // ✅ Unlimited Quantity Handling
  const quantityInput = document.getElementById('quantity');
  const unlimitedCheckbox = document.getElementById('unlimitedCheckbox');
  if (unlimitedCheckbox && quantityInput) {
    unlimitedCheckbox.addEventListener('change', () => {
      quantityInput.disabled = unlimitedCheckbox.checked;
      if (unlimitedCheckbox.checked) quantityInput.value = '';
    });
  }
>>>>>>> cd573ee12ea5d10772ada60cf09242d9dc9b026e

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

<<<<<<< HEAD
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

=======
  selectAllCheckbox.addEventListener('change', () => {
    isSelectAllActive = selectAllCheckbox.checked;
    buyerInputs.forEach(input => input.checked = isSelectAllActive);
    updateSelectionUI();
  });
>>>>>>> cd573ee12ea5d10772ada60cf09242d9dc9b026e

  buyerInputs.forEach(input => {
    input.addEventListener('change', () => {
      if (selectAllCheckbox.checked && !input.checked) {
        selectAllCheckbox.checked = false;
        isSelectAllActive = false;
      }
      updateSelectionUI();
    });
  });

  searchInput.addEventListener('input', () => {
    const keyword = searchInput.value.toLowerCase();
    buyerCheckboxes.forEach(div => {
      const label = div.innerText.toLowerCase();
      div.style.display = label.includes(keyword) ? 'flex' : 'none';
    });
  });

  function updateSelectionUI() {
    let count = 0;
    buyerCheckboxes.forEach(div => {
<<<<<<< HEAD
      const input = div.querySelector('input[type="checkbox"]');
=======
      const input = div.querySelector('input');
>>>>>>> cd573ee12ea5d10772ada60cf09242d9dc9b026e
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
<<<<<<< HEAD
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
}
else {
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
        idInput.name = 'buyerIds';
        idInput.value = buyerId;
        idInput.classList.add('hidden-buyer-input');

        const qtyInput = document.createElement('input');
        qtyInput.type = 'hidden';
        qtyInput.name = 'buyerQuantities';
        qtyInput.value = qty;
        qtyInput.classList.add('hidden-buyer-input');

        dealForm.appendChild(idInput);
        dealForm.appendChild(qtyInput);
=======
    document.querySelectorAll('.hidden-buyer-input').forEach(inp => inp.remove());
    sendToAllInput.value = isSelectAllActive ? 'true' : 'false';

    if (!isSelectAllActive) {
      buyerInputs.forEach(input => {
        if (input.checked) {
          const hiddenInput = document.createElement('input');
          hiddenInput.type = 'hidden';
          hiddenInput.name = 'buyerIds';
          hiddenInput.value = input.value;
          hiddenInput.classList.add('hidden-buyer-input');
          dealForm.appendChild(hiddenInput);
        }
>>>>>>> cd573ee12ea5d10772ada60cf09242d9dc9b026e
      });
    }

    dealForm.submit();
  });

<<<<<<< HEAD
  // ✅ Toggle Handling for status switches
=======
  // ✅ Toggle Handling
>>>>>>> cd573ee12ea5d10772ada60cf09242d9dc9b026e
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
<<<<<<< HEAD
=======
            toggle.closest('.card-body').querySelector('.add-quantity-form')?.remove();
>>>>>>> cd573ee12ea5d10772ada60cf09242d9dc9b026e
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
<<<<<<< HEAD
          alert('✅ Status updated.');
          location.reload();
=======
  alert('✅ Quantity added and deal activated.');
  location.reload(); // 🔄 Reload the page to reflect changes



          
          
>>>>>>> cd573ee12ea5d10772ada60cf09242d9dc9b026e
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
