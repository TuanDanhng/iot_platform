let chart = null;
let chartTitle = '';      // hiển thị trên modal
let chartUnit = '';
let chartTileId = '';     // tile id hiện đang mở (oxy1, oxy2,...)
let mode = 'realtime';
let realtimeInterval = null;

// ---------------- EraWidget ----------------
const eraWidget = new EraWidget();
let configMap = {};    // map datastreamName -> ERA ID
let sensorData = {};   // lưu giá trị realtime mới nhất, key = datastreamName
let sensorBuffer = {}; // lưu buffer dữ liệu cho chart, key = datastreamName

// Map tile ID -> datastream name (trùng với datastream name trên ERA)
const sensorMap = {
  oxy1: "V",
  oxy2: "V2",
  oxy:  "V3",
  vac:  "V4",
  air4: "V5",
  air7: "V6"
};

// Khởi tạo buffer cho từng datastream name
Object.values(sensorMap).forEach(name => sensorBuffer[name] = []);

// Lấy config từ Era (map datastream name -> era id)
eraWidget.onConfiguration((configuration) => {
  configuration.realtime_configs.forEach(cfg => {
    // chỉ lưu những datastream ta quan tâm
    if (Object.values(sensorMap).includes(cfg.name)) {
      configMap[cfg.name] = cfg.id;
    }
  });
});

// Nhận dữ liệu realtime từ Era
// values object keyed by eraId
eraWidget.onValues((values) => {
  for (let id in values) {
    // tìm datastreamName tương ứng với era id
    let sensorName = Object.keys(configMap).find(name => configMap[name] === id);
    if (sensorName) {
      const raw = values[id].value;
      const val = (typeof raw === 'number') ? raw : parseFloat(raw);
      const num = isNaN(val) ? 0 : val;

      // lưu giá trị
      sensorData[sensorName] = num;

      // lưu vào buffer
      sensorBuffer[sensorName].push(num);
      if (sensorBuffer[sensorName].length > 50) {
        sensorBuffer[sensorName].shift();
      }
    }
  }

  // cập nhật số trên dashboard ngay khi có dữ liệu
  updateDashboardValues();
});

eraWidget.ready();

// ---------------- Dashboard ----------------
function updateDashboardValues() {
  for (let tileId in sensorMap) {
    const sensorName = sensorMap[tileId];
    const rawVal = sensorData[sensorName];
    const num = (rawVal === undefined || rawVal === null) ? 0 : Number(rawVal);
    const el = document.getElementById(tileId);
    if (el) el.textContent = (isNaN(num) ? 0 : num).toFixed(2);
  }
}

// ---------------- Chart ----------------
// openChart: truyền (tileId, title, unit)
function openChart(tileId, title, unit='') {
  document.getElementById('chartModal').style.display = 'block';
  document.getElementById('chartTitle').innerText = title || tileId;
  chartTitle = title || tileId;
  chartUnit = unit;
  chartTileId = tileId;

  mode = 'realtime';
  const radio = document.querySelector('input[value="realtime"]');
  if (radio) radio.checked = true;
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

  // tìm datastream name từ tileId
  const sensorName = sensorMap[chartTileId];
  if (!sensorName) {
    // không tìm thấy mapping -> thoát
    createChart([0], chartUnit);
    return;
  }

  // lấy dữ liệu hiện có trong buffer
  let data = sensorBuffer[sensorName] ? [...sensorBuffer[sensorName]] : [0];
  createChart(data, chartUnit);

  // update chart mỗi giây dựa trên sensorData
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

  // Lấy buffer hiện tại để vẽ (tạm thời)
  const sensorName = sensorMap[chartTileId];
  const data = sensorName && sensorBuffer[sensorName] ? [...sensorBuffer[sensorName]] : [];
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
