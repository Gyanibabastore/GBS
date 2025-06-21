document.addEventListener("DOMContentLoaded", () => {
  try {
    const searchBar = document.createElement('div');
    searchBar.className = 'row mb-4';

    searchBar.innerHTML = `
      <div class="col-md-6">
        <input type="month" class="form-control" id="monthFilter" onchange="filterByDate()" />
      </div>
      <div class="col-md-6">
        <input type="date" class="form-control" id="exactDateFilter" onchange="filterByDate()" />
      </div>
    `;

    const container = document.querySelector('.container');
    const insertBeforeElem = document.querySelector('.row.g-4');

    if (container && insertBeforeElem) {
      container.insertBefore(searchBar, insertBeforeElem);
    } else {
      console.error("❌ Could not inject search filters – container or target missing.");
      alert("Unable to load filters. Please refresh the page.");
    }

    // Define globally so it can be triggered from input onchange
    window.filterByDate = function () {
      try {
        const month = document.getElementById('monthFilter')?.value;
        const exactDate = document.getElementById('exactDateFilter')?.value;
        const cards = document.querySelectorAll('.row.g-4 .col-md-6');

        if (!cards.length) {
          alert("No data found to filter.");
          return;
        }

        cards.forEach(card => {
          try {
            const dateText = card.querySelector('.card-text')?.innerText.match(/\d{4}-\d{2}-\d{2}/)?.[0];
            let show = true;

            if (month && (!dateText || !dateText.startsWith(month))) {
              show = false;
            }

            if (exactDate && dateText !== exactDate) {
              show = false;
            }

            card.style.display = show ? '' : 'none';
          } catch (cardErr) {
            console.warn("⚠️ Skipping one card due to error:", cardErr);
          }
        });

      } catch (filterErr) {
        console.error("❌ Error while filtering by date:", filterErr);
        alert("Something went wrong while filtering. Please try again.");
      }
    };
    
  } catch (initErr) {
    console.error("❌ JS init failed:", initErr);
    alert("Failed to initialize filters. Please try refreshing the page.");
  }
});
