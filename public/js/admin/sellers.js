document.addEventListener("DOMContentLoaded", () => {
  try {
    const searchInput = document.getElementById("searchInput");
    const sellerCards = document.querySelectorAll(".seller-card-container");

    if (!searchInput || sellerCards.length === 0) {
      console.warn("🔍 Search input or seller cards not found.");
      alert("Something went wrong while loading seller search. Please refresh.");
      return;
    }

    searchInput.addEventListener("keyup", () => {
      try {
        const input = searchInput.value.toLowerCase();

        sellerCards.forEach(card => {
          try {
            const name = card.querySelector(".card-title")?.textContent.toLowerCase() || "";
            const mobile = card.querySelector(".card-text")?.textContent.toLowerCase() || "";

            if (name.includes(input) || mobile.includes(input)) {
              card.style.display = "";
            } else {
              card.style.display = "none";
            }
          } catch (cardErr) {
            console.warn("⚠️ Error processing a seller card:", cardErr);
          }
        });

      } catch (searchErr) {
        console.error("❌ Error during seller search:", searchErr);
        alert("An error occurred while searching. Please try again.");
      }
    });

  } catch (initErr) {
    console.error("❌ Failed to initialize seller search:", initErr);
    alert("Failed to set up search bar. Please refresh or contact support.");
  }
});
