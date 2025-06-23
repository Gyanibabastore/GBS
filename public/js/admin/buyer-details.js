document.addEventListener('DOMContentLoaded', () => {
  // Handle Month Change
  const monthSelect = document.getElementById('monthSelect');
  if (monthSelect) {
    monthSelect.addEventListener('change', () => {
      const selectedMonth = monthSelect.value;
      const url = new URL(window.location.href);
      url.searchParams.set('month', selectedMonth);
      window.location.href = url.toString();
    });
  }

  // Pie Chart: Out for Delivery
  try {
    const pieCtx = document.getElementById("outForDeliveryPie").getContext("2d");
    new Chart(pieCtx, {
      type: "pie",
      data: {
        labels: pieChartLabels,
        datasets: [{
          label: "Out for Delivery",
          data: pieChartData,
          backgroundColor: [
            "#007bff", "#28a745", "#ffc107", "#dc3545", "#6f42c1", "#17a2b8"
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" }
        }
      }
    });
  } catch (err) {
    console.error("Pie chart rendering error:", err);
  }

  // Bar Chart: Total Orders
  try {
    const barCtx = document.getElementById("totalOrdersBar").getContext("2d");
    new Chart(barCtx, {
      type: "bar",
      data: {
        labels: barChartLabels,
        datasets: [{
          label: "Total Orders",
          data: barChartData,
          backgroundColor: "#007bff"
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  } catch (err) {
    console.error("Bar chart rendering error:", err);
  }
});
