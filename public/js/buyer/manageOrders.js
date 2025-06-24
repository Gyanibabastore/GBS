document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ JS loaded and DOM ready");

  const toggleBtn = document.getElementById("toggle-pending-btn");
  const pendingSection = document.getElementById("pending-orders");

  toggleBtn?.addEventListener("click", () => {
    if (!pendingSection) {
      alert("❌ Pending section not found");
      return;
    }
    const isHidden = pendingSection.style.display === "none";
    pendingSection.style.display = isHidden ? "block" : "none";
    toggleBtn.textContent = isHidden ? "Hide Pending Orders" : "Show Pending Orders";
    console.log("🔄 Toggled Pending Orders section");
  });

  const increaseButtons = document.querySelectorAll(".qty-increase");
  const decreaseButtons = document.querySelectorAll(".qty-decrease");

  increaseButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const index = btn.getAttribute("data-index");
      adjustQuantity(index, 1);
    });
  });

  decreaseButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const index = btn.getAttribute("data-index");
      adjustQuantity(index, -1);
    });
  });

  function adjustQuantity(index, delta) {
    const qtySpan = document.getElementById(`qty-${index}`);
    const formQty = document.getElementById(`form-qty-${index}`);
    const maxQty = document.getElementById(`max-qty-${index}`);

    if (!qtySpan || !formQty || !maxQty) {
      alert('❌ Quantity fields not found.');
      console.log("⛔ Error: Quantity elements missing");
      return;
    }

    let qty = parseInt(qtySpan.textContent);
    const max = parseInt(maxQty.value);
    qty += delta;

    if (qty < 1) {
      alert("❗ Minimum quantity is 1.");
      return;
    }

    if (qty > max) {
      alert(`❗ Cannot exceed available quantity (${max})`);
      return;
    }

    qtySpan.textContent = qty;
    formQty.value = qty;
    console.log(`✅ Updated quantity to ${qty} at index ${index}`);
  }

  const forms = document.querySelectorAll(".order-form");
  forms.forEach(form => {
    form.addEventListener("submit", (e) => {
      const index = form.getAttribute("data-index");
      console.log("🔁 Submitting order for index:", index);
    });
  });
});
