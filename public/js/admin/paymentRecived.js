document.addEventListener('DOMContentLoaded', () => {
  const filterDate = document.getElementById('filterDate');
  const filterMonth = document.getElementById('filterMonth');

  if (filterDate) {
    filterDate.addEventListener('change', () => {
      const dateVal = filterDate.value;
      if (dateVal) {
        filterMonth.selectedIndex = -1;
        window.location.href = `/admin/payments?filterDate=${dateVal}`;
      } else {
        window.location.href = `/admin/payments`;
      }
    });
  }

  if (filterMonth) {
    filterMonth.addEventListener('change', () => {
      const monthVal = filterMonth.value;
      if (monthVal) {
        filterDate.value = '';
        window.location.href = `/admin/payments?filterMonth=${encodeURIComponent(monthVal)}`;
      } else {
        window.location.href = `/admin/payments`;
      }
    });
  }
});
