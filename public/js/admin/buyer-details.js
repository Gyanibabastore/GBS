document.addEventListener('DOMContentLoaded', () => {
  try {
    const orderCards = document.querySelectorAll('.order-card');
    if (!orderCards.length) throw new Error("No order cards found.");

    const labels = [];
    const data = [];
    const bgColors = [];

    orderCards.forEach(card => {
      try {
        const title = card.querySelector('.card-title')?.textContent || "Unknown";
        const qtyText = card.querySelector('.card-text:nth-child(4)')?.textContent || "";
        const qty = parseInt(qtyText.split(':')[1]?.trim()) || 0;
        const color = card.style.borderLeftColor || (card.style.borderLeft?.split(" ")[2]) || "#007bff";

        labels.push(title);
        data.push(qty);
        bgColors.push(color);
      } catch (innerErr) {
        console.warn("Error parsing individual card:", innerErr);
      }
    });

    const ctx = document.getElementById('orderChart')?.getContext('2d');
    if (!ctx) throw new Error("Order chart canvas not found.");
    
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Order Quantity',
          data,
          backgroundColor: bgColors
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });

    // Month filter handler
    const monthSelect = document.getElementById('monthSelect');
    if (monthSelect) {
      monthSelect.addEventListener('change', function () {
        const selectedMonth = this.value;
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('month', selectedMonth);
        window.location.href = currentUrl.toString();
      });
    }
  } catch (err) {
    console.error("🔥 Error loading order chart:", err);
    alert("⚠️ Error rendering order chart. Please try again or contact support.");
  }

  // Pie Chart - Out for Delivery
  try {
    const pieCtx = document.getElementById("outForDeliveryPie")?.getContext("2d");
    if (!pieCtx) throw new Error("Out for Delivery pie chart canvas not found.");
    
    if (!window.deliveryPieLabels || !window.deliveryPieData) {
      throw new Error("Pie chart data not found.");
    }

    new Chart(pieCtx, {
      type: "pie",
      data: {
        labels: deliveryPieLabels,
        datasets: [{
          label: "Out for Delivery",
          data: deliveryPieData,
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
    console.error("🔥 Pie chart error:", err);
    alert("⚠️ Failed to render Out for Delivery chart.");
  }

  // Bar Chart - Total Orders by Brand
  try {
    const barCtx = document.getElementById("totalOrdersBar")?.getContext("2d");
    if (!barCtx) throw new Error("Total orders bar chart canvas not found.");

    if (!window.totalOrderBarLabels || !window.totalOrderBarData) {
      throw new Error("Total orders bar chart data missing.");
    }

    new Chart(barCtx, {
      type: "bar",
      data: {
        labels: totalOrderBarLabels,
        datasets: [{
          label: "Total Orders",
          data: totalOrderBarData,
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
    console.error("🔥 Bar chart error:", err);
    alert("⚠️ Failed to render Total Orders chart.");
  }
});
