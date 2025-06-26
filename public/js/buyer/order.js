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
<<<<<<< HEAD
=======

  // Initial filter state on load
  filterOrders(searchBox ? searchBox.value : "");
>>>>>>> cd573ee12ea5d10772ada60cf09242d9dc9b026e
});

function filterOrders(searchTerm) {
  const term = searchTerm.toLowerCase();
  const selectedStatus = document.getElementById("statusFilter").value;
<<<<<<< HEAD
  const wrappers = document.querySelectorAll("#orders-container .order-card-wrapper");
=======
  const container = document.getElementById("orders-container");
  const wrappers = container.querySelectorAll(".order-card-wrapper");

  let anyVisible = false;
>>>>>>> cd573ee12ea5d10772ada60cf09242d9dc9b026e

  wrappers.forEach(wrapper => {
    const model = wrapper.getAttribute("data-model") || '';
    const status = wrapper.getAttribute("data-status") || '';

    const statusMatch = status === selectedStatus;
    const searchMatch = model.includes(term);

    if (statusMatch && searchMatch) {
      wrapper.classList.remove("d-none");
<<<<<<< HEAD
=======
      anyVisible = true;
>>>>>>> cd573ee12ea5d10772ada60cf09242d9dc9b026e
    } else {
      wrapper.classList.add("d-none");
    }
  });
<<<<<<< HEAD
=======

  if (anyVisible) {
    container.classList.remove("empty");
  } else {
    container.classList.add("empty");
  }
>>>>>>> cd573ee12ea5d10772ada60cf09242d9dc9b026e
}
