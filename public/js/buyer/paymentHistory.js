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
