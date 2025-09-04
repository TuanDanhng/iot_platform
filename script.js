let chart = null;
let chartTitle = '';
let chartUnit = '';
let chartTileId = '';
let mode = 'realtime';
let realtimeInterval = null;

// ---------------- EraWidget ----------------
const eraWidget = new EraWidget();
let configMap = {};    // datastreamName -> ERA ID
let sensorData = {};   // datastreamName -> last value
let sensorBuffer = {}; // datastreamName -> buffer values

// Map tileId -> datastream name (trùng với name trong ERA)
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

// Nhận config từ ERA
eraWidget.onConfiguration((configuration) => {
  configuration.realtime_configs.forEach(cfg => {
    if (Object.values(sensorMap).includes(cfg.name)) {
      configMap[cfg.name] = cfg.id;
    }
  });
});

// Nhận dữ liệu realtime
eraWidget.onValues((values) => {
  for (let id in values) {
    let sensorName = Object.keys(configMap).find(name => configMap[name] === id);
    if (sensorName) {
      const raw = values[id].value;
      const val = (typeof raw === 'number') ? raw : parseFloat(raw);
      const num = isNaN(val) ? 0 : val;

      sensorData[sensorName] = num;
      sensorBuffer[sensorName].push(num);
      if (sensorBuffer[sensorName].length > 50) sensorBuffer[sensorName].shift();
    }
  }
  updateDashboardValues();
});

eraWidget.ready();

// ---------------- Dashboard ----------------
function updateDashboardValues() {
  for (let tileId in sensorMap) {
    const sensorName = sensorMap[tileId];
    const val = sensorData[sensorName];
    const el = document.getElementById(tileId);
    if (el) el.textContent = (val !== undefined ? Number(val).toFixed(2) : "--");
  }
}

// ---------------- Chart ----------------
function openChart(tileId, title, unit='') {
  document.getElementById('chartModal').style.display = 'block';
  document.getElementById('chartTitle').innerText = title;
  chartTitle = title;
  chartUnit = unit;
  chartTileId = tileId;

  mode = 'realtime';
  document.querySelector('input[value="realtime"]').checked = true;
  document.getElementById('timeRangeBox').style.display = 'none';

  startRealtimeChart();
}

function closeChart() {
  document.getElementById('chartModal').style.display = 'none';
  if (chart) chart.destroy();
  if (realtimeInterval) clearInterval(realtimeInterval);
  chartTileId = '';
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

  const sensorName = sensorMap[chartTileId];
  if (!sensorName) {
    createChart([0], chartUnit);
    return;
  }

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
        label: chartTitle + (unit ? ' (' + unit + ')' : ''),
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
  if (!chart) return;
  chart.data.labels = Array.from({ length: data.length }, (_, i) => i + 1);
  chart.data.datasets[0].data = data;
  chart.update();
}

// ---------------- Lịch sử ----------------
function loadHistory() {
  const start = document.getElementById('startTime').value;
  const end = document.getElementById('endTime').value;
  if (!start || !end) {
    alert('Vui lòng chọn cả thời
