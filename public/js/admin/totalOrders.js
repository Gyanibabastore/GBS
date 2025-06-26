document.addEventListener('DOMContentLoaded', function () {
  try {
    const soldCtx = document.getElementById('soldPieChart')?.getContext('2d');
    const availableCtx = document.getElementById('availablePieChart')?.getContext('2d');

    if (!soldCtx || !availableCtx) {
      console.error('❌ Chart canvas not found.');
      return;
    }

    const preparePieData = (data) => {
      if (!Array.isArray(data)) return { labels: [], values: [], backgroundColors: [] };
      const labels = data.map(item => item.brand || 'Unknown');
      const values = data.map(item => item.count || 0);
      const backgroundColors = labels.map(() =>
        `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`
      );
      return { labels, values, backgroundColors };
    };

    const createPieChart = (ctx, labels, data, colors, titleText) => {
      return new Chart(ctx, {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: colors,
            borderColor: '#fff',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.label}: ${ctx.raw}`
              }
            },
            title: {
              display: true,
              text: titleText,
              font: { size: 18 }
            }
          }
        }
      });
    };

    const sold = preparePieData(window.soldBrandData);
    createPieChart(soldCtx, sold.labels, sold.values, sold.backgroundColors, 'Sold Devices (Brand + Model)');

    const available = preparePieData(window.availableBrandData);
    createPieChart(availableCtx, available.labels, available.values, available.backgroundColors, 'Available Devices (Brand + Model)');

    // Chart export handler
    document.querySelectorAll('.download-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const chartId = btn.dataset.chart;
        const type = btn.dataset.type;
        const canvas = document.getElementById(chartId);

        if (!canvas) return alert('Canvas not found.');

        if (type === 'png') {
          const link = document.createElement('a');
          link.download = `${chartId}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        } else if (type === 'pdf') {
          const { jsPDF } = window.jspdf;
          if (!jsPDF) return alert('PDF export unavailable.');
          const pdf = new jsPDF();
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 15, 40, 180, 100);
          pdf.save(`${chartId}.pdf`);
        }
      });
    });

    // Filters
    document.getElementById('monthFilter')?.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val) window.location.href = `/admin/total-orders?month=${val}`;
    });

    document.getElementById('dateFilter')?.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val) window.location.href = `/admin/total-orders?date=${val}`;
    });

    document.getElementById('resetFilters')?.addEventListener('click', () => {
      window.location.href = '/admin/total-orders';
    });

  } catch (err) {
    console.error('❌ JS error:', err);
    alert('Error loading dashboard features.');
  }
});
