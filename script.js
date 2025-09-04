let chart = null;
let chartLabel = '';
let chartUnit = '';
let mode = 'realtime';
let realtimeInterval = null;

// ---------------- EraWidget ----------------
const eraWidget = new EraWidget();
let configMap = {};    // map sensor name -> ERA ID
let sensorData = {};   // lưu giá trị realtime mới nhất
let sensorBuffer = {}; // lưu buffer dữ liệu cho chart

// Map tile ID -> sensor name (trùng với datastream name trên ERA)
const sensorMap = {
  oxy1: "giá trị rs485",
  oxy2: "giá trị rs485_2",
  oxy:  "giá trị rs485_3",
  vac:  "giá trị rs485_4",
  air4: "giá trị rs485_5",
  air7: "giá trị rs485_6"
};

// Khởi tạo buffer
Object.values(sensorMap).forEach(name => sensorBuffer[name] = []);

// Lấy config từ Era
eraWidget.onConfiguration((configuration) => {
  configuration.realtime_configs.forEach(cfg => {
    if (Object.values(sensorMap).includes(cfg.name)) {
      configMap[cfg.name] = cfg.id;
    }
  });
});

// Nhận dữ liệu realtime từ Era
eraWidget.onValues((values) => {
  for (let id in values) {
    let sensorName = Object.keys(configMap).find(name => configMap[name] === id);
    if (sensorName) {
      const val = values[id].value;
      sensorData[sensorName] = val;

      // cập nhật buffer
      sensorBuffer[sensorName].push(val);
      if (sensorBuffer[sensorName].length > 50) {
        sensorBuffer[sensorName].shift();
      }
    }
  }
});

eraWidget.ready();

// ---------------- Dashboard ----------------
function updateDashboardValues() {
  for (let tileId in sensorMap) {
    const sensorName = sensorMap[tileId];
    const val = sensorData[sensorName] !== undefined ? sensorData[sensorName] : 0;
    const el = document.getElementById(tileId);
    if (el) el.textContent = val.toFixed(2);
  }
}

// ---------------- Chart ----------------
function openChart(label, unit='') {
  document.getElementById('chartModal').style.display = 'block';
  document.getElementById('chartTitle').innerText = label;
  chartLabel = label;
  chartUnit = unit;

  mode = 'realtime';
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
    createChart([], chartUnit);
  }
}

function startRealtimeChart() {
  if (realtimeInterval) clearInterval(realtimeInterval);

  // tìm sensorName tương ứng với chartLabel
  let sensorName = Object.values(sensorMap).find(name => chartLabel.includes(name) || chartLabel.includes(name.toUpperCase()));
  if (!sensorName) return;

  let data = sensorBuffer[sensorName] ? [...sensorBuffer[sensorName]] : [0];
  createChart(data, chartUnit);

  realtimeInterval = setInterval(() => {
    const val = sensorData[sensorName] !== undefined ? sensorData[sensorName] : 0;
    data.push(val);
    if (data.length > 50) data.shift();
    updateChart(data);
  }, 1000);
}

function createChart(data, unit) {
  const ctx = document.getElementById('realtimeChart').getContext('2d');
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({ length: data.length }, (_, i) => i + 1),
      datasets: [{
        label: chartLabel + (unit ? ' (' + unit + ')' : ''),
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
  chart.data.labels = Array.from({ length: data.length }, (_, i) => i + 1);
  chart.data.datasets[0].data = data;
  chart.update();
}

// ---------------- Lịch sử ----------------
function loadHistory() {
  const start = document.getElementById('startTime').value;
  const end = document.getElementById('endTime').value;
  if (!start || !end) {
    alert('Vui lòng chọn cả thời gian bắt đầu và kết thúc.');
    return;
  }

  const startTime = new Date(start);
  const endTime = new Date(end);
  const diffMs = endTime - startTime;

  if (diffMs <= 0) {
    alert('Thời gian kết thúc phải sau thời gian bắt đầu.');
    return;
  }

  const data = sensorBuffer[chartLabel] ? [...sensorBuffer[chartLabel]] : [];
  createChart(data, chartUnit);
}

// ---------------- Khi load trang ----------------
window.addEventListener('load', function() {
  updateDashboardValues();
  setInterval(updateDashboardValues, 1000);
});

// ---------------- Đóng modal khi click ngoài ----------------
window.onclick = function(event) {
  const modal = document.getElementById('chartModal');
  if (event.target === modal) {
    closeChart();
  }
};
