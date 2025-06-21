function filterByDate(date) {
  if (date) {
    const baseUrl = window.location.origin + window.location.pathname;
    window.location.href = `${baseUrl}?date=${date}`;
  }
}

