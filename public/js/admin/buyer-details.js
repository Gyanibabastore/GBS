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
          backgroundColor: pieChartLabels.map(() =>
            `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`
          )
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
          title: {
            display: true,
            text: "Out-for-Delivery Devices (Brand + Model)"
          }
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
          legend: { display: false },
          title: {
            display: true,
            text: "Total Orders (Brand + Model)"
          }
        }
      }
    });
  } catch (err) {
    console.error("Bar chart rendering error:", err);
  }
});
