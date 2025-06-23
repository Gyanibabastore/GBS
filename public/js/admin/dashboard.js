document.addEventListener('DOMContentLoaded', () => {
  try {
    const monthInput = document.getElementById('monthFilter');
    const dateInput = document.getElementById('dateFilter');
    const resetBtn = document.getElementById('resetFilters');

    if (!monthInput || !dateInput || !resetBtn) {
      throw new Error("One or more filter elements not found");
    }

    // Month filter
    monthInput.addEventListener('change', () => {
      try {
        if (monthInput.value) {
          dateInput.value = '';
          window.location.href = `/admin/dashboard?month=${monthInput.value}`;
        }
      } catch (err) {
        console.error("⚠️ Error changing month filter:", err);
        alert("Something went wrong while applying the month filter.");
      }
    });

    // Date filter
    dateInput.addEventListener('change', () => {
      try {
        if (dateInput.value) {
          monthInput.value = '';
          window.location.href = `/admin/dashboard?date=${dateInput.value}`;
        }
      } catch (err) {
        console.error("⚠️ Error changing date filter:", err);
        alert("Something went wrong while applying the date filter.");
      }
    });

    // Reset button
    resetBtn.addEventListener('click', () => {
      try {
        window.location.href = `/admin/dashboard`;
      } catch (err) {
        console.error("⚠️ Error resetting filters:", err);
        alert("Something went wrong while resetting filters.");
      }
    });

    // Chart Rendering
    if (typeof renderCharts === 'function') {
      renderCharts(soldBrandData, availableBrandData, barChartData);
    } else {
      throw new Error("renderCharts function not found.");
    }

    // Bind download chart buttons
    document.querySelectorAll('button[data-download]').forEach(button => {
      button.addEventListener('click', () => {
        const chartId = button.getAttribute('data-download');
        const type = button.getAttribute('data-type');
        downloadChart(chartId, type);
      });
    });

  } catch (err) {
    console.error("🔥 Critical Error in DOMContentLoaded:", err);
    alert("A major error occurred while loading the dashboard. Please refresh.");
  }
});

function renderCharts(soldData, availableData, barData) {
  try {
    const soldCtx = document.getElementById('soldPieChart')?.getContext('2d');
    const availableCtx = document.getElementById('availablePieChart')?.getContext('2d');
    const barCtx = document.getElementById('barChart')?.getContext('2d');

    if (!soldCtx || !availableCtx || !barCtx) {
      throw new Error("Chart canvas elements missing.");
    }

    new Chart(soldCtx, {
      type: 'pie',
      data: {
        labels: soldData.map(d => d.label),
        datasets: [{
          data: soldData.map(d => d.count),
          backgroundColor: generateColors(soldData.length),
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });

    new Chart(availableCtx, {
      type: 'pie',
      data: {
        labels: availableData.map(d => d.label),
        datasets: [{
          data: availableData.map(d => d.count),
          backgroundColor: generateColors(availableData.length),
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });

    new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: barData.map(b => b.label),
        datasets: [
          {
            label: "Sold",
            data: barData.map(b => b.sold),
            backgroundColor: '#198754'
          },
          {
            label: "Available",
            data: barData.map(b => b.available),
            backgroundColor: '#ffc107'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        }
      }
    });

  } catch (err) {
    console.error("📉 Chart rendering failed:", err);
    alert("Charts couldn't be loaded. Try reloading the page.");
  }
}


function generateColors(count) {
  const baseColors = [
    "#007bff", "#28a745", "#ffc107", "#dc3545", "#6f42c1", "#17a2b8",
    "#fd7e14", "#20c997", "#6610f2", "#e83e8c", "#6c757d", "#343a40"
  ];
  return Array.from({ length: count }, (_, i) => baseColors[i % baseColors.length]);
}

function downloadChart(chartId, type) {
  try {
    const canvas = document.getElementById(chartId);
    if (!canvas) throw new Error("Canvas not found");

    if (type === 'png') {
      const link = document.createElement('a');
      link.download = `${chartId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } else if (type === 'pdf') {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF();
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 15, 15, 180, 100);
      pdf.save(`${chartId}.pdf`);
    }
  } catch (err) {
    console.error(`❌ Failed to download chart (${chartId}, ${type}):`, err);
    alert("Error downloading chart.");
  }
}
