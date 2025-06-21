document.addEventListener("DOMContentLoaded", function () {
  const inputElement = document.getElementById("searchInput");
  const cardContainer = document.querySelectorAll("#buyerList .buyer-card");

  if (!inputElement || !cardContainer.length) {
    console.error("❌ Required elements for filtering not found.");
    return;
  }

  inputElement.addEventListener("keyup", function () {
    try {
      const input = inputElement.value.toLowerCase();

      cardContainer.forEach(card => {
        try {
          const name = card.querySelector(".card-title")?.textContent.toLowerCase() || "";
          const mobile = card.querySelector(".card-text")?.textContent.toLowerCase() || "";

          const cardWrapper = card.closest(".mb-3");
          if (!cardWrapper) return;

          if (name.includes(input) || mobile.includes(input)) {
            cardWrapper.style.display = "";
          } else {
            cardWrapper.style.display = "none";
          }
        } catch (innerErr) {
          console.warn("❗ Buyer card rendering error:", innerErr);
        }
      });
    } catch (err) {
      console.error("🔥 Buyer filter failed:", err);
      alert("⚠️ Failed to filter buyers. Please refresh the page or try again.");
    }
  });
});
