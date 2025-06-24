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

  // quantity + unlimited logic
  const quantityInput = document.getElementById('quantity');
  const unlimitedCheckbox = document.getElementById('unlimitedCheckbox');

  if (unlimitedCheckbox && quantityInput) {
    unlimitedCheckbox.addEventListener('change', () => {
      if (unlimitedCheckbox.checked) {
        quantityInput.value = '';
        quantityInput.disabled = true;
      } else {
        quantityInput.disabled = false;
      }
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
    console.log("🟢 Submit button clicked");
    document.querySelectorAll('.hidden-buyer-input').forEach(inp => inp.remove());

    sendToAllInput.value = isSelectAllActive ? 'true' : 'false';
    console.log("✅ sendToAllInput set to:", sendToAllInput.value);

    if (!isSelectAllActive) {
      buyerInputs.forEach(input => {
        if (input.checked) {
          const hiddenInput = document.createElement('input');
          hiddenInput.type = 'hidden';
          hiddenInput.name = 'buyerIds';
          hiddenInput.value = input.value;
          hiddenInput.classList.add('hidden-buyer-input');
          dealForm.appendChild(hiddenInput);
          console.log("📝 Appending buyer ID:", input.value);
        }
      });
    }

    dealForm.submit();
  });

  // ✅ Toggle deal status switch
  const toggleSwitches = document.querySelectorAll('.toggle-status');
  toggleSwitches.forEach(toggle => {
    toggle.addEventListener('change', async () => {
      const dealId = toggle.getAttribute('data-id');
      try {
        const res = await fetch(`/admin/deals/toggle/${dealId}`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          toggle.nextElementSibling.innerText = data.newStatus === 'active' ? '🟢 Active' : '🔴 Inactive';
        } else {
          alert('Failed to update deal status.');
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
