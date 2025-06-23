document.addEventListener("DOMContentLoaded", function () {
  try {
    const stockDataScript = document.getElementById("stockDataScript");
    if (!stockDataScript) throw new Error("Stock data script tag not found.");

    let rawStockData;

    try {
      rawStockData = JSON.parse(stockDataScript.textContent);
    } catch (parseErr) {
      console.error("JSON Parse Error in stock data:", parseErr);
      alert("⚠️ Error loading stock chart data. Please refresh or contact admin.");
      return;
    }

    if (!Array.isArray(rawStockData) || rawStockData.length === 0) {
      console.warn("No stock data found.");
      alert("ℹ️ No stock data available to display.");
      return;
    }

    // ✅ Group by brand + deviceName
    const labelMap = {};
    rawStockData.forEach(item => {
      const label = `${item.brand} - ${item.model}`;
      labelMap[label] = (labelMap[label] || 0) + item.quantity;
    });

    const labels = Object.keys(labelMap);
    const data = Object.values(labelMap);

    const chartCanvas = document.getElementById("stockChart");
    if (!chartCanvas) throw new Error("Chart canvas not found.");

    const ctx = chartCanvas.getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Stock Quantity",
          data: data,
          backgroundColor: "rgba(54, 162, 235, 0.7)"
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
          x: {
            ticks: {
              autoSkip: false,
              maxRotation: 45,
              minRotation: 20
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (context) => context[0].label,
              label: (context) => `Qty: ${context.raw}`
            }
          }
        }
      }
    });
  } catch (err) {
    console.error("🔥 Stock Chart JS Error:", err);
    alert("⚠️ Something went wrong while rendering the stock chart.");
  }
});
