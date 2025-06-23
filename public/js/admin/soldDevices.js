document.addEventListener('DOMContentLoaded', () => {
  // Initialize Chart
  try {
    const chartCanvas = document.getElementById('brandBarChart');
    if (!chartCanvas) {
      alert('Could not render the chart. Please reload the page.');
      return;
    }

    const ctx = chartCanvas.getContext('2d');

    if (!window.brandLabels || !window.brandData) {
      alert('Chart data is not available. Please try again later.');
      return;
    }

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: window.brandLabels, // now includes "Brand - DeviceName"
        datasets: [{
          label: 'Devices Sold',
          data: window.brandData,
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
          borderRadius: 8,
          hoverBackgroundColor: 'rgba(54, 162, 235, 0.9)'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Sold Devices (Brand + Model)',
            font: { size: 18 }
          },
          tooltip: {
            callbacks: {
              title: ctx => ctx[0].label,
              label: ctx => `Sold: ${ctx.raw}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          },
          x: {
            ticks: {
              autoSkip: false,
              maxRotation: 45,
              minRotation: 20
            }
          }
        }
      }
    });
  } catch (chartErr) {
    console.error('❌ Error rendering chart:', chartErr);
    alert('An error occurred while rendering the chart.');
  }

  // Table Filter
  const filterTable = () => {
    try {
      const monthVal = document.getElementById('monthFilter')?.value;
      const dateVal = document.getElementById('dateFilter')?.value;
      const rows = document.querySelectorAll('#soldDevicesTable tr');

      rows.forEach(row => {
        try {
          const soldDate = row.children[4]?.textContent.trim();
          if (!soldDate) return;

          let show = true;

          if (monthVal) {
            const [year, month] = soldDate.split('-');
            const [filterYear, filterMonth] = monthVal.split('-');
            if (year !== filterYear || month !== filterMonth) show = false;
          }

          if (dateVal && soldDate !== dateVal) {
            show = false;
          }

          row.style.display = show ? '' : 'none';
        } catch (rowErr) {
          console.warn('⚠️ Error filtering a row:', rowErr);
        }
      });
    } catch (filterErr) {
      console.error('❌ Filter logic error:', filterErr);
      alert('Filtering failed. Please try again.');
    }
  };

  // Reset Filters
  const resetFilter = () => {
    try {
      const monthInput = document.getElementById('monthFilter');
      const dateInput = document.getElementById('dateFilter');
      if (monthInput) monthInput.value = '';
      if (dateInput) dateInput.value = '';
      filterTable();
    } catch (resetErr) {
      console.error('❌ Reset error:', resetErr);
      alert('Could not reset filters. Please reload the page.');
    }
  };

  document.getElementById('monthFilter')?.addEventListener('change', filterTable);
  document.getElementById('dateFilter')?.addEventListener('change', filterTable);
  document.getElementById('resetBtn')?.addEventListener('click', resetFilter);
});
