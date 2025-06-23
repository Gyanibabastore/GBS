document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggleExpandBtn");
  const form = document.getElementById("expand-card");

  if (toggleBtn && form) {
    toggleBtn.addEventListener("click", () => {
      const isVisible = form.style.display === "block";
      form.style.display = isVisible ? "none" : "block";

      if (!isVisible) {
        form.scrollIntoView({ behavior: "smooth" });
      }
    });
  }
});
