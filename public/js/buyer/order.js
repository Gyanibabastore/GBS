document.addEventListener("DOMContentLoaded", () => {
  const searchBox = document.getElementById("searchBox");
  const statusFilter = document.getElementById("statusFilter");

  if (searchBox) {
    searchBox.addEventListener("keyup", () => {
      filterOrders(searchBox.value);
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", () => {
      filterOrders(searchBox.value);
    });
  }

  // Run once on load (in case defaultStatus is pre-selected)
  filterOrders(searchBox.value);
});

function filterOrders(searchTerm) {
  const term = (searchTerm || "").toLowerCase();
  const selectedStatus = document.getElementById("statusFilter").value;
  const wrappers = document.querySelectorAll("#orders-container .order-card-wrapper");

  wrappers.forEach(wrapper => {
    const model = wrapper.getAttribute("data-model") || '';
    const status = wrapper.getAttribute("data-status") || '';

    const statusMatch = selectedStatus === "" || status === selectedStatus;
    const searchMatch = model.includes(term);

    if (statusMatch && searchMatch) {
      wrapper.classList.remove("d-none");
    } else {
      wrapper.classList.add("d-none");
    }
  });
}
document.addEventListener("DOMContentLoaded", () => {
  const cancelButtons = document.querySelectorAll(".cancel-btn");

  cancelButtons.forEach(button => {
    button.addEventListener("click", async (e) => {
      e.preventDefault();

      const orderId = button.getAttribute("data-order-id");

      try {
        const response = await fetch(`/buyer/orders/${orderId}/cancel-request`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (response.ok) {
          button.textContent = '🚫 Requested';
          button.classList.remove('btn-danger');
          button.classList.add('btn-secondary');
          button.disabled = true;
        } else {
          alert(data.message || "Something went wrong");
        }
      } catch (error) {
        console.error("❌ Cancel request failed:", error);
        alert("Failed to send cancel request");
      }
    });
  });
});

