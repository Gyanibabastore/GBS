document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ JS loaded and DOM fully ready");

  const toggleBtn = document.getElementById("toggle-pending-btn");
  const pendingSection = document.getElementById("pending-orders");

  if (!toggleBtn) {
    console.log("❌ Toggle button (#toggle-pending-btn) not found.");
  } else {
    console.log("✅ Toggle button found.");
  }

  if (!pendingSection) {
    console.log("❌ Pending orders section (#pending-orders) not found.");
  } else {
    console.log("✅ Pending orders section found.");
  }

  toggleBtn?.addEventListener("click", () => {
    if (!pendingSection) {
      alert("❌ Pending section not found");
      return;
    }

    const isHidden = pendingSection.style.display === "none";
    pendingSection.style.display = isHidden ? "block" : "none";
    toggleBtn.textContent = isHidden ? "Hide Pending Orders" : "Show Pending Orders";

    console.log(`🔁 Pending section is now ${isHidden ? "visible" : "hidden"}`);

    if (isHidden) {
      setTimeout(() => {
        pendingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        console.log("📜 Scrolled into view.");
      }, 100);
    }
  });

  // 🔼🔽 Quantity buttons
  const increaseButtons = document.querySelectorAll(".qty-increase");
  const decreaseButtons = document.querySelectorAll(".qty-decrease");

  console.log(`🧮 Found ${increaseButtons.length} increase buttons`);
  console.log(`🧮 Found ${decreaseButtons.length} decrease buttons`);

  increaseButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const index = btn.getAttribute("data-index");
      console.log(`➕ Increase button clicked for index ${index}`);
      adjustQuantity(index, 1);
    });
  });

  decreaseButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const index = btn.getAttribute("data-index");
      console.log(`➖ Decrease button clicked for index ${index}`);
      adjustQuantity(index, -1);
    });
  });

  function adjustQuantity(index, delta) {
    console.log(`⚙️ Adjusting quantity for index ${index}, delta ${delta}`);

    const qtySpan = document.getElementById(`qty-${index}`);
    const formQty = document.getElementById(`form-qty-${index}`);
    const maxQty = document.getElementById(`max-qty-${index}`);

    if (!qtySpan || !formQty || !maxQty) {
      alert('❌ Quantity fields not found.');
      console.log("⛔ Error: Quantity elements missing for index", index);
      return;
    }

    let qty = parseInt(qtySpan.textContent);
    const max = parseInt(maxQty.value);
    qty += delta;

    if (qty < 1) {
      alert("❗ Minimum quantity is 1.");
      console.log(`⛔ Tried to set quantity < 1 for index ${index}`);
      return;
    }

    if (qty > max) {
      alert(`❗ Cannot exceed available quantity (${max})`);
      console.log(`⛔ Tried to exceed max quantity ${max} for index ${index}`);
      return;
    }

    qtySpan.textContent = qty;
    formQty.value = qty;
    console.log(`✅ Updated quantity to ${qty} for index ${index}`);
  }

  
});

// 📦 Show More functionality
const showMoreBtn = document.getElementById("show-more-btn");
let currentVisible = 8;

if (!showMoreBtn) {
  console.log("❌ Show More button (#show-more-btn) not found");
} else {
  console.log("✅ Show More button found");
}

showMoreBtn?.addEventListener("click", () => {
  const cards = document.querySelectorAll(".pending-order-card");
  const total = cards.length;
  const nextVisible = Math.min(currentVisible + 8, total);

  console.log(`📦 Show More clicked. Showing cards ${currentVisible} to ${nextVisible - 1}`);

  for (let i = currentVisible; i < nextVisible; i++) {
    cards[i].style.display = "block";
    console.log(`✅ Made card ${i} visible`);
  }

  currentVisible = nextVisible;

  if (currentVisible >= total) {
    showMoreBtn.style.display = "none";
    console.log("🎯 All cards visible. Hiding Show More button.");
  }
});
