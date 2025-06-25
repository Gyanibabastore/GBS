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
});

function filterOrders(searchTerm) {
  const term = searchTerm.toLowerCase();
  const selectedStatus = document.getElementById("statusFilter").value;
  const wrappers = document.querySelectorAll("#orders-container .order-card-wrapper");

  wrappers.forEach(wrapper => {
    const model = wrapper.getAttribute("data-model") || '';
    const status = wrapper.getAttribute("data-status") || '';

    const statusMatch = status === selectedStatus;
    const searchMatch = model.includes(term);

    if (statusMatch && searchMatch) {
      wrapper.classList.remove("d-none");
    } else {
      wrapper.classList.add("d-none");
    }
  });
}
