document.addEventListener('DOMContentLoaded', () => {
  const dealForm = document.getElementById('dealForm');
  const buyerModal = document.getElementById('buyerModal');
  const triggerBuyerModal = document.getElementById('triggerBuyerModal');
  const closeBuyerModal = document.getElementById('closeBuyerModal');
  const cancelBuyerModal = document.getElementById('cancelBuyerModal');
  const buyerCheckboxes = document.querySelectorAll('.buyer-checkbox');
  const buyerInputs = document.querySelectorAll('.buyer-checkbox-input');
  const selectAllCheckbox = document.getElementById('selectAllBuyers');
  const searchInput = document.getElementById('buyerSearch');
  const confirmBtn = document.getElementById('confirmCreateDeal');
  const selectedCount = document.getElementById('selectedCount');
  const sendToAllInput = document.getElementById('sendToAllInput');

  // ✅ Unlimited Quantity Handling
  const quantityInput = document.getElementById('quantity');
  const unlimitedCheckbox = document.getElementById('unlimitedCheckbox');
  if (unlimitedCheckbox && quantityInput) {
    unlimitedCheckbox.addEventListener('change', () => {
      quantityInput.disabled = unlimitedCheckbox.checked;
      if (unlimitedCheckbox.checked) quantityInput.value = '';
    });
  }

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
      const input = div.querySelector('input');
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
      });
    }

    dealForm.submit();
  });

  // ✅ Toggle Handling
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
            toggle.closest('.card-body').querySelector('.add-quantity-form')?.remove();
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
  alert('✅ Quantity added and deal activated.');
  location.reload(); // 🔄 Reload the page to reflect changes



          
          
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
