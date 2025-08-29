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

let eraWidget = new EraWidget();
let sensorData = {}; // lưu dữ liệu các sensor
let sensorIdMap = {}; // map ID của sensor theo ô dashboard

// Khởi tạo map sensor: thay 'sensor_era_id' bằng ID thật của sensor trên ERA
sensorIdMap = {
  "oxy1": "sensor_oxy1_id",
  "oxy2": "sensor_oxy2_id",
  "oxy": "sensor_oxy_id",
  "vac": "sensor_vac_id",
  "air4": "sensor_air4_id",
  "air7": "sensor_air7_id"
};

// Nhận cấu hình sensor từ ERA
eraWidget.onConfiguration(cfg => {
  cfg.realtime_configs.forEach(c => {
    sensorData[c.id] = 0; // khởi tạo giá trị mặc định
  });
});

// Nhận dữ liệu realtime từ ERA
eraWidget.onValues(values => {
  for (let id in values) {
    sensorData[id] = values[id].value;
  }

  // Cập nhật dashboard
  for (let key in sensorIdMap) {
    const value = sensorData[sensorIdMap[key]] || 0;
    document.getElementById(key).textContent = parseFloat(value).toFixed(2);
  }

  // Nếu chart đang mở và là realtime
  if (chart && mode === 'realtime') {
    const key = Object.keys(sensorIdMap).find(k => k.toLowerCase() === chartLabel.toLowerCase().replace(/ /g,''));
    if (key) {
      const value = parseFloat(sensorData[sensorIdMap[key]] || 0);
      const chartData = chart.data.datasets[0].data;
      chartData.push(value);
      if (chartData.length > 20) chartData.shift();
      updateChart(chartData);
    }
  }
});

eraWidget.ready();

// === Chart và modal ===
function openChart(label, unit) {
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
  let data = [];

  // Lấy 10 điểm ban đầu từ dữ liệu sensor
  const key = Object.keys(sensorIdMap).find(k => k.toLowerCase() === chartLabel.toLowerCase().replace(/ /g,''));
  if (key) {
    for (let i = 0; i < 10; i++) data.push(parseFloat(sensorData[sensorIdMap[key]] || 0));
  }
  createChart(data, chartUnit);

  realtimeInterval = setInterval(() => {
    if (key) {
      const value = parseFloat(sensorData[sensorIdMap[key]] || 0);
      data.push(value);
      if (data.length > 20) data.shift();
      updateChart(data);
    }
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
  chart.data.labels = Array.from({ length: data.length }, (_, i) => i + 1);
  chart.data.datasets[0].data = data;
  chart.update();
}

// === Modal click ngoài để đóng ===
window.onclick = function(event) {
  const modal = document.getElementById('chartModal');
  if (event.target === modal) {
    closeChart();
  }
};

// === Lịch sử (vẫn dùng dữ liệu giả để demo) ===
function loadHistory() {
  const start = document.getElementById('startTime').value;
  const end = document.getElementById('endTime').value;
  if (!start || !end) { alert('Vui lòng chọn cả thời gian bắt đầu và kết thúc.'); return; }

  const startTime = new Date(start);
  const endTime = new Date(end);
  const diffMs = endTime - startTime;

  if (diffMs <= 0) { alert('Thời gian kết thúc phải sau thời gian bắt đầu.'); return; }

  const diffMinutes = Math.floor(diffMs / 60000);
  let points = diffMinutes;
  if (points < 5) points = 5;
  if (points > 200) points = 200;

  const data = Array.from({length: points}, () => (Math.random()*100).toFixed(2));
  createChart(data, chartUnit);
}
