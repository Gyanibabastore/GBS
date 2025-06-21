document.addEventListener('DOMContentLoaded', () => {
  try {
    // Month Filter Logic
    const monthSelect = document.getElementById('monthSelect');
    if (monthSelect) {
      monthSelect.addEventListener('change', () => {
        try {
          const selectedMonth = monthSelect.value;
          const url = new URL(window.location.href);
          url.searchParams.set('month', selectedMonth);
          window.location.href = url.toString();
        } catch (monthErr) {
          console.error("❌ Month filter error:", monthErr);
          alert("Failed to apply month filter. Try again.");
        }
      });
    }

    // PIE CHART: Out for Delivery (Brand-wise)
    const pieData = window.chartData?.pie;
    const pieCtx = document.getElementById('outForDeliveryPie');

    if (pieCtx && pieData && pieData.labels?.length > 0) {
      new Chart(pieCtx, {
        type: 'pie',
        data: {
          labels: pieData.labels,
          datasets: [{
            label: 'Out for Delivery',
            data: pieData.data,
            backgroundColor: pieData.labels.map((_, i) =>
              `hsl(${(i * 60) % 360}, 70%, 60%)`
            ),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    } else if (!pieCtx) {
      console.warn("📊 Pie chart canvas not found.");
    } else {
      console.warn("📊 Pie chart data missing or empty.");
    }

    // BAR CHART: Total Orders (Brand-wise)
    const barData = window.chartData?.bar;
    const barCtx = document.getElementById('totalOrdersBar');

    if (barCtx && barData && barData.labels?.length > 0) {
      new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: barData.labels,
          datasets: [{
            label: 'Total Orders',
            data: barData.data,
            backgroundColor: barData.labels.map((_, i) =>
              `hsl(${(i * 60) % 360}, 80%, 50%)`
            )
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    } else if (!barCtx) {
      console.warn("📊 Bar chart canvas not found.");
    } else {
      console.warn("📊 Bar chart data missing or empty.");
    }

  } catch (globalErr) {
    console.error("🚨 Dashboard JS critical failure:", globalErr);
    alert("Something went wrong loading the dashboard. Please refresh the page.");
  }
});
