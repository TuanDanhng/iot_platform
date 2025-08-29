let chart = null;
let chartLabel = '';
let chartUnit = '';
let mode = 'realtime'; 
let realtimeInterval = null;

function openChart(label, unit) {
  document.getElementById('chartModal').style.display = 'block';
  document.getElementById('chartTitle').innerText = label;
  chartLabel = label;
  chartUnit = unit;

  mode = 'realtime'; // mặc định khi mở
  document.querySelector('input[value="realtime"]').checked = true;
  document.getElementById('timeRangeBox').style.display = 'none';

  startRealtimeChart();
}

function closeChart() {
  document.getElementById('chartModal').style.display = 'none';
  if (chart) chart.destroy();
  if (realtimeInterval) clearInterval(realtimeInterval);
}

function switchMode() {
  mode = document.querySelector('input[name="mode"]:checked').value;
  if (mode === 'realtime') {
    document.getElementById('timeRangeBox').style.display = 'none';
    startRealtimeChart();
  } else {
    document.getElementById('timeRangeBox').style.display = 'block';
    if (realtimeInterval) clearInterval(realtimeInterval);
    createChart([], chartUnit); // ban đầu trống
  }
}

function startRealtimeChart() {
  if (realtimeInterval) clearInterval(realtimeInterval);
  let data = getRandomData(10);
  createChart(data, chartUnit);

  realtimeInterval = setInterval(() => {
    data.push((Math.random() * 100).toFixed(2));
    if (data.length > 20) data.shift();
    updateChart(data);
  }, 1000);
}

function createChart(data, unit) {
  const ctx = document.getElementById('realtimeChart').getContext('2d');
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({length: data.length}, (_, i) => i + 1),
      datasets: [{
        label: chartLabel + ' (' + unit + ')',
        data: data,
        borderColor: 'blue',
        fill: false,
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      animation: false,
      scales: {
        x: { title: { display: true, text: 'Thời gian' } },
        y: { title: { display: true, text: unit } }
      }
    }
  });
}

function updateChart(data) {
  chart.data.labels = Array.from({length: data.length}, (_, i) => i + 1);
  chart.data.datasets[0].data = data;
  chart.update();
}

function getRandomData(points) {
  return Array.from({length: points}, () => (Math.random() * 100).toFixed(2));
}

// Giả lập tải dữ liệu lịch sử theo khoảng thời gian
function loadHistory() {
  const start = document.getElementById('startTime').value;
  const end = document.getElementById('endTime').value;
  if (!start || !end) {
    alert('Vui lòng chọn cả thời gian bắt đầu và kết thúc.');
    return;
  }
  // Giả lập số điểm dựa trên khoảng cách thời gian (thực tế gọi API để lấy dữ liệu)
  const points = 30; // bạn có thể tính theo thời gian thực
  createChart(getRandomData(points), chartUnit);
}

// Đóng modal khi click ngoài
window.onclick = function(event) {
  const modal = document.getElementById('chartModal');
  if (event.target === modal) {
    closeChart();
  }
};
