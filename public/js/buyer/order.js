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
      filterStatus(statusFilter.value);
    });
  }
});

function filterOrders(searchTerm) {
  const term = searchTerm.toLowerCase();
  const cards = document.querySelectorAll("#orders-container .card");

  cards.forEach(card => {
    const model = card.getAttribute("data-model") || '';
    const statusMatch = filterByStatus(card);
    const searchMatch = model.includes(term);

    if (statusMatch && searchMatch) {
      card.classList.remove("d-none");
    } else {
      card.classList.add("d-none");
    }
  });
}

function filterStatus(status) {
  const cards = document.querySelectorAll("#orders-container .card");
  const searchBox = document.getElementById("searchBox");
  const searchTerm = searchBox.value.toLowerCase();

  cards.forEach(card => {
    const cardStatus = card.getAttribute("data-status") || '';
    const model = card.getAttribute("data-model") || '';
    const statusMatch = cardStatus === status;
    const searchMatch = model.includes(searchTerm);

    if (statusMatch && searchMatch) {
      card.classList.remove("d-none");
    } else {
      card.classList.add("d-none");
    }
  });
}

function filterByStatus(card) {
  const statusFilter = document.getElementById("statusFilter");
  const selectedStatus = statusFilter.value;
  return card.getAttribute("data-status") === selectedStatus;
}
