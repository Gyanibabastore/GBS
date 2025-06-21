document.addEventListener('DOMContentLoaded', () => {
  const filterDate = document.getElementById('filterDate');
  const filterMonth = document.getElementById('filterMonth');

  if (filterDate) {
    filterDate.addEventListener('change', () => {
      const date = filterDate.value;
      const params = new URLSearchParams(window.location.search);
      if (date) {
        params.set('filterDate', date);
        params.delete('filterMonth');
      } else {
        params.delete('filterDate');
      }
      window.location.search = params.toString();
    });
  }

  if (filterMonth) {
    filterMonth.addEventListener('change', () => {
      const month = filterMonth.value;
      const params = new URLSearchParams(window.location.search);
      if (month) {
        params.set('filterMonth', month);
        params.delete('filterDate');
      } else {
        params.delete('filterMonth');
      }
      window.location.search = params.toString();
    });
  }
});
