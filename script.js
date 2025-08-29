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
let configMap = {};    // map sensor name -> ERA ID
let sensorData = {};   // lưu giá trị realtime mới nhất
let sensorBuffer = {}; // lưu buffer dữ liệu cho chart lịch sử tạm thời

// Các tên sensor bạn có
const sensorNames = [
    "giá trị rs485",
    "giá trị rs485_2",
    "giá trị rs485_3",
    "giá trị rs485_4",
    "giá trị rs485_5",
    "giá trị rs485_6",
];

// Khởi tạo buffer cho từng sensor
sensorNames.forEach(name => {
    sensorBuffer[name] = [];
});

// Lấy config từ Era
eraWidget.onConfiguration((configuration) => {
    configuration.realtime_configs.forEach(cfg => {
        if (sensorNames.includes(cfg.name)) {
            configMap[cfg.name] = cfg.id;
        }
    });
});

// Lấy dữ liệu realtime từ Era
eraWidget.onValues((values) => {
    for (let id in values) {
        let sensorName = Object.keys(configMap).find(name => configMap[name] === id);
        if (sensorName) {
            const val = values[id].value;
            sensorData[sensorName] = val;

            // Lưu vào buffer để chart
            sensorBuffer[sensorName].push(val);
            if (sensorBuffer[sensorName].length > 50) { // giới hạn 50 điểm
                sensorBuffer[sensorName].shift();
            }
        }
    }
});

eraWidget.ready();

// ---------------- Dashboard ----------------
function createDashboard() {
    const container = document.getElementById('dashboardContainer');
    container.innerHTML = '';
    sensorNames.forEach(name => {
        const box = document.createElement('div');
        box.className = 'sensorBox';
        box.id = 'box_' + name;
        box.innerHTML = `
            <div class="sensorName">${name}</div>
            <div class="sensorValue" id="val_${name}">0</div>
        `;
        box.onclick = () => openChart(name);
        container.appendChild(box);
    });
}

function updateDashboardValues() {
    sensorNames.forEach(name => {
        const val = sensorData[name] !== undefined ? sensorData[name] : 0;
        const el = document.getElementById('val_' + name);
        if (el) el.textContent = val;
    });
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

    const diffMinutes = Math.floor(diffMs / 60000);
    let points = diffMinutes;
    if (points < 5) points = 5;
    if (points > 200) points = 200;

    // Lấy buffer hiện tại để vẽ (không dùng random)
    const data = sensorBuffer[chartLabel] ? [...sensorBuffer[chartLabel]] : [];
    createChart(data, chartUnit);
}

// ---------------- Khi load trang ----------------
window.addEventListener('load', function() {
    createDashboard();
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
