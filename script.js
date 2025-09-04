// let chart = null;
// let chartLabel = '';
// let chartUnit = '';
// let mode = 'realtime';
// let realtimeInterval = null;

// function openChart(label, unit) {
//   document.getElementById('chartModal').style.display = 'block';
//   document.getElementById('chartTitle').innerText = label;
//   chartLabel = label;
//   chartUnit = unit;

//   mode = 'realtime'; // mặc định khi mở
//   document.querySelector('input[value="realtime"]').checked = true;
//   document.getElementById('timeRangeBox').style.display = 'none';

//   startRealtimeChart();
// }

// function closeChart() {
//   document.getElementById('chartModal').style.display = 'none';
//   if (chart) chart.destroy();
//   if (realtimeInterval) clearInterval(realtimeInterval);
// }

// function switchMode() {
//   mode = document.querySelector('input[name="mode"]:checked').value;
//   if (mode === 'realtime') {
//     document.getElementById('timeRangeBox').style.display = 'none';
//     startRealtimeChart();
//   } else {
//     document.getElementById('timeRangeBox').style.display = 'block';
//     if (realtimeInterval) clearInterval(realtimeInterval);
//     createChart([], chartUnit); // ban đầu trống
//   }
// }

// function startRealtimeChart() {
//   if (realtimeInterval) clearInterval(realtimeInterval);
//   let data = getRandomData(10);
//   createChart(data, chartUnit);

//   realtimeInterval = setInterval(() => {
//     data.push((Math.random() * 100).toFixed(2));
//     if (data.length > 20) data.shift();
//     updateChart(data);

//   }, 1000);

// }



// function createChart(data, unit) {
//   const ctx = document.getElementById('realtimeChart').getContext('2d');
//   if (chart) chart.destroy();
//   chart = new Chart(ctx, {
//     type: 'line',
//     data: {
//       labels: Array.from({ length: data.length }, (_, i) => i + 1),
//       datasets: [{
//         label: chartLabel + ' (' + unit + ')',
//         data: data,
//         borderColor: 'blue',
//         fill: false,
//         tension: 0.1
//       }]
//     },
//     options: {
//       responsive: true,
//       animation: false,
//       scales: {
//         x: { title: { display: true, text: 'Thời gian' } },
//         y: { title: { display: true, text: unit } }
//       }
//     }
//   });
// }

// function updateChart(data) {
//   chart.data.labels = Array.from({ length: data.length }, (_, i) => i + 1);
//   chart.data.datasets[0].data = data;
//   chart.update();
// }

// function getRandomData(points) {
//   return Array.from({ length: points }, () => (Math.random() * 100).toFixed(2));
// }

// // Giả lập tải dữ liệu lịch sử theo khoảng thời gian
// function loadHistory() {
//   const start = document.getElementById('startTime').value;
//   const end = document.getElementById('endTime').value;
//   if (!start || !end) {
//     alert('Vui lòng chọn cả thời gian bắt đầu và kết thúc.');
//     return;
//   }

//   const startTime = new Date(start);
//   const endTime = new Date(end);
//   const diffMs = endTime - startTime;

//   if (diffMs <= 0) {
//     alert('Thời gian kết thúc phải sau thời gian bắt đầu.');
//     return;
//   }

//   // Giả sử lấy 1 điểm mỗi phút
//   const diffMinutes = Math.floor(diffMs / 60000);
//   let points = diffMinutes;
//   if (points < 5) points = 5;        // ít nhất 5 điểm để biểu đồ không bị trống
//   if (points > 200) points = 200;    // giới hạn 200 điểm để không nặng máy

//   const data = getRandomData(points);
//   createChart(data, chartUnit);
// }


// // Đóng modal khi click ngoài
// window.onclick = function (event) {
//   const modal = document.getElementById('chartModal');
//   if (event.target === modal) {
//     closeChart();
//   }
// };

// // Hàm cập nhật giá trị dashboard mỗi giây (độc lập)
// function updateDashboardValues() {
//   document.getElementById("oxy1").textContent = (Math.random() * 100).toFixed(2);
//   document.getElementById("oxy2").textContent = (Math.random() * 100).toFixed(2);
//   document.getElementById("oxy").textContent  = (Math.random() * 10).toFixed(2);
//   document.getElementById("vac").textContent  = (Math.random() * 1).toFixed(2);
//   document.getElementById("air4").textContent = (Math.random() * 0.1).toFixed(2);
//   document.getElementById("air7").textContent = (Math.random() * 10).toFixed(2);
// }

// // Khi tải trang, chạy cập nhật giá trị dashboard liên tục
// window.addEventListener("load", function() {
//   updateDashboardValues(); // gọi ngay 1 lần để có dữ liệu ban đầu
//   setInterval(updateDashboardValues, 1000); // lặp lại mỗi giây
// });


let chart = null;
let chartLabel = '';
let chartUnit = '';
let mode = 'realtime';
let realtimeInterval = null;

// ---------------- EraWidget ----------------
const eraWidget = new EraWidget();

// Khởi tạo config cho từng sensor
let configOxy1 = null;
let configOxy2 = null;
let configOxy  = null;
let configVac  = null;
let configAir4 = null;
let configAir7 = null;

// Giá trị hiện thời
let sensorData = {
  oxy1: 0,
  oxy2: 0,
  oxy: 0,
  vac: 0,
  air4: 0,
  air7: 0
};

// Buffer cho chart
let sensorBuffer = {
  oxy1: [],
  oxy2: [],
  oxy: [],
  vac: [],
  air4: [],
  air7: []
};

// Khi nhận configuration từ Era
eraWidget.onConfiguration((configuration) => {
    configOxy1 = configuration.realtime_configs[0];
    configOxy2 = configuration.realtime_configs[1];
    configOxy  = configuration.realtime_configs[2];
    configVac  = configuration.realtime_configs[3];
    configAir4 = configuration.realtime_configs[4];
    configAir7 = configuration.realtime_configs[5];

    // Load history khi có config
    loadHistory();
});

// Khi nhận giá trị realtime từ Era
eraWidget.onValues((values) => {
    // Cập nhật từng sensor
    if (configOxy1 && values[configOxy1.id]) updateSensor('oxy1', values[configOxy1.id].value);
    if (configOxy2 && values[configOxy2.id]) updateSensor('oxy2', values[configOxy2.id].value);
    if (configOxy  && values[configOxy.id])  updateSensor('oxy',  values[configOxy.id].value);
    if (configVac  && values[configVac.id])  updateSensor('vac',  values[configVac.id].value);
    if (configAir4 && values[configAir4.id]) updateSensor('air4', values[configAir4.id].value);
    if (configAir7 && values[configAir7.id]) updateSensor('air7', values[configAir7.id].value);

    // Cập nhật chart realtime nếu đang mở
    if (chartLabel && mode === 'realtime') {
        const data = sensorBuffer[chartLabel] ? [...sensorBuffer[chartLabel]] : [0];
        updateChart(data);
    }
});

// Hàm cập nhật sensor và buffer
function updateSensor(key, val) {
    sensorData[key] = val;

    sensorBuffer[key].push(val);
    if (sensorBuffer[key].length > 50) sensorBuffer[key].shift();

    const el = document.getElementById(key);
    if (el) el.textContent = val.toFixed(2);
}

// Khởi động EraWidget
eraWidget.ready();



// ---------------- Chart ----------------
function openChart(label, unit='') {
  chartLabel = labelToKey(label);
  chartUnit = unit;

  document.getElementById('chartModal').style.display = 'block';
  document.getElementById('chartTitle').innerText = label;

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
    createChart(sensorBuffer[chartLabel] || [], chartUnit);
  }
}

function startRealtimeChart() {
  if (realtimeInterval) clearInterval(realtimeInterval);
  let data = sensorBuffer[chartLabel] ? [...sensorBuffer[chartLabel]] : [0];
  createChart(data, chartUnit);

  realtimeInterval = setInterval(() => {
    const val = sensorData[chartLabel] !== undefined ? sensorData[chartLabel] : 0;
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
  if (!chart) return;
  chart.data.labels = Array.from({ length: data.length }, (_, i) => i + 1);
  chart.data.datasets[0].data = data;
  chart.update();
}

function loadHistory() {
  const start = document.getElementById('startTime').value;
  const end = document.getElementById('endTime').value;
  if (!start || !end) return;

  const data = sensorBuffer[chartLabel] ? [...sensorBuffer[chartLabel]] : [];
  createChart(data, chartUnit);
}

// Chuyển label hiển thị sang key tương ứng với id
function labelToKey(label) {
  switch(label) {
    case 'Bồn Oxy 1': return 'oxy1';
    case 'Bồn Oxy 2': return 'oxy2';
    case 'Oxy': return 'oxy';
    case 'Khí Hút - VAC': return 'vac';
    case 'Khí Nén - AIR4': return 'air4';
    case 'Khí Nén - AIR7': return 'air7';
    default: return '';
  }
}

// ---------------- Khi load trang ----------------
window.addEventListener('load', function() {
  // Dashboard đã có sẵn HTML, chỉ cần update giá trị realtime
  setInterval(() => {
    Object.keys(sensorData).forEach(key => {
      const el = document.getElementById(key);
      if (el) el.textContent = sensorData[key].toFixed(2);
    });
  }, 1000);
});

// ---------------- Đóng modal khi click ngoài ----------------
window.onclick = function(event) {
  const modal = document.getElementById('chartModal');
  if (event.target === modal) closeChart();
};

