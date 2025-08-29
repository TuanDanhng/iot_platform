let chart;
let chartLabel = '';
let chartUnit = '';

function openChart(label, unit) {
  document.getElementById('chartTitle').innerText = label + ' (' + unit + ')';
  chartLabel = label;
  chartUnit = unit;
  document.getElementById('chartModal').style.display = 'block';
  initChart();
}

function closeChart() {
  document.getElementById('chartModal').style.display = 'none';
  if (chart) chart.destroy();
}

function initChart() {
  const ctx = document.getElementById('realtimeChart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: chartLabel,
        data: [],
        borderColor: 'blue',
        fill: false
      }]
    },
    options: {
      animation: false,
      scales: {
        x: { title: { display: true, text: 'Thời gian' }},
        y: { title: { display: true, text: chartUnit }}
      }
    }
  });
  updateChartData();
}

function updateChartData() {
  setInterval(() => {
    const now = new Date().toLocaleTimeString();
    const randomValue = (Math.random() * 10).toFixed(2); // test dữ liệu random
    if (chart.data.labels.length > 20) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }
    chart.data.labels.push(now);
    chart.data.datasets[0].data.push(randomValue);
    chart.update();
  }, 1000);
}

function changeTimeRange() {
  const range = document.getElementById('timeRange').value;
  console.log("Đổi khoảng thời gian:", range);
}
