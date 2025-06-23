document.addEventListener('DOMContentLoaded', () => {
  try {
    // Month Filter Handler
    const monthSelect = document.getElementById('monthSelect');
    if (monthSelect) {
      monthSelect.addEventListener('change', () => {
        const selectedMonth = monthSelect.value;
        const url = new URL(window.location.href);
        url.searchParams.set('month', selectedMonth);
        window.location.href = url.toString();
      });
    }

    // PIE CHART
    const pieData = window.chartData?.pie;
    const pieCtx = document.getElementById('outForDeliveryPie');
    if (pieCtx && pieData?.labels?.length > 0) {
      new Chart(pieCtx, {
        type: 'pie',
        data: {
          labels: pieData.labels,
          datasets: [{
            label: 'Out for Delivery',
            data: pieData.data,
            backgroundColor: pieData.labels.map((_, i) =>
              `hsl(${(i * 360 / pieData.labels.length)}, 70%, 60%)`
            ),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.raw;
                  return `${label}: ${value}`;
                }
              }
            }
          }
        }
      });
    }

    // BAR CHART
    const barData = window.chartData?.bar;
    const barCtx = document.getElementById('totalOrdersBar');
    if (barCtx && barData?.labels?.length > 0) {
      new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: barData.labels,
          datasets: [{
            label: 'Total Orders',
            data: barData.data,
            backgroundColor: barData.labels.map((_, i) =>
              `hsl(${(i * 360 / barData.labels.length)}, 60%, 55%)`
            )
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.raw;
                  return `${label}: ${value}`;
                }
              }
            }
          }
        }
      });
    }

  } catch (err) {
    console.error("🚨 Dashboard JS error:", err);
    alert("Something went wrong loading the dashboard. Please try again.");
  }
});
