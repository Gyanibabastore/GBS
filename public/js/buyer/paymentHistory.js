document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.querySelector('input[type="date"]');
  if (dateInput) {
    dateInput.addEventListener('change', function () {
      const date = this.value;
      if (date) {
        const baseUrl = window.location.origin + window.location.pathname;
        console.log("Redirecting to: ", `${baseUrl}?date=${date}`);
        window.location.href = `${baseUrl}?date=${date}`;
      }
    });
  }
});
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  const closeBtn = document.querySelector(".close-btn");

  // Attach click listeners to all payment images
  document.querySelectorAll(".payment-img").forEach(img => {
    img.addEventListener("click", () => {
      const src = img.getAttribute("data-src");
      modal.style.display = "block";
      modalImg.src = src;
    });
  });

  // Close modal on overlay or X click
  closeBtn?.addEventListener("click", () => {
    modal.style.display = "none";
  });

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
});
