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

  // Initial filter state on load
  filterOrders(searchBox ? searchBox.value : "");
});

function filterOrders(searchTerm) {
  const term = searchTerm.toLowerCase();
  const selectedStatus = document.getElementById("statusFilter").value;
  const container = document.getElementById("orders-container");
  const wrappers = container.querySelectorAll(".order-card-wrapper");

  let anyVisible = false;

  wrappers.forEach(wrapper => {
    const model = wrapper.getAttribute("data-model") || '';
    const status = wrapper.getAttribute("data-status") || '';

    const statusMatch = status === selectedStatus;
    const searchMatch = model.includes(term);

    if (statusMatch && searchMatch) {
      wrapper.classList.remove("d-none");
      anyVisible = true;
    } else {
      wrapper.classList.add("d-none");
    }
  });

  if (anyVisible) {
    container.classList.remove("empty");
  } else {
    container.classList.add("empty");
  }
}
