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


// ======================================
// ERA Widget setup
// ======================================
const eraWidget = new EraWidget();
let configMap = {};   // map sensor ID từ ERA
let sensorData = {};  // lưu giá trị sensor mới nhất

eraWidget.onConfiguration((configuration) => {
    // Lấy tất cả config realtime
    configuration.realtime_configs.forEach(cfg => {
        configMap[cfg.name] = cfg.id; // key là tên sensor, value là ID
    });
});

eraWidget.onValues((values) => {
    // values[ID].value là giá trị thực tế từ ERA
    for (let id in values) {
        sensorData[id] = values[id].value;
    }
});

eraWidget.ready();

// ======================================
// Map dashboard ID với ERA sensor name
// ======================================
let sensorIdMap = {
    "oxy1": "rs485",       // Bồn Oxy 1
    "oxy2": "rs485_2",     // Bồn Oxy 2
    "oxy": "rs485_3",      // Oxy
    "vac": "rs485_4",      // Khí hút VAC
    "air4": "rs485_5",     // Khí nén AIR4
    "air7": "rs485_6",     // Khí nén AIR7
    // Nếu muốn thêm sensor thứ 7
    //"someOther": "rs485_7"
};


// ======================================
// Dashboard update
// ======================================
function updateDashboardValues() {
    for (let key in sensorIdMap) {
        const sensorName = sensorIdMap[key];
        const value = sensorData[configMap[sensorName]] || 0;
        document.getElementById(key).textContent = parseFloat(value).toFixed(2);
    }
}

// Cập nhật liên tục mỗi giây
setInterval(updateDashboardValues, 1000);

// ======================================
// Chart modal
// ======================================
let chart = null;
let chartLabel = '';
let chartUnit = '';
let mode = 'realtime';
let realtimeInterval = null;
let chartData = [];

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
        createChart([], chartUnit); // ban đầu trống
    }
}

// ======================================
// Chart realtime
// ======================================
function startRealtimeChart() {
    if (realtimeInterval) clearInterval(realtimeInterval);

    chartData = []; // reset dữ liệu chart
    createChart(chartData, chartUnit);

    realtimeInterval = setInterval(() => {
        // Lấy sensor ID tương ứng với chartLabel
        const key = Object.keys(sensorIdMap).find(k => chartLabel.toLowerCase().includes(k.toLowerCase()));
        let value = 0;
        if (key) {
            const sensorName = sensorIdMap[key];
            value = parseFloat(sensorData[configMap[sensorName]] || 0);
        }

        chartData.push(value);
        if (chartData.length > 20) chartData.shift();
        updateChart(chartData);

    }, 1000);
}

// ======================================
// Chart helper functions
// ======================================
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

// ======================================
// History (hiện vẫn giả lập)
// ======================================
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

    // Hiện vẫn lấy dữ liệu giả
    const data = Array.from({ length: points }, () => (Math.random() * 100).toFixed(2));
    createChart(data, chartUnit);
}

// ======================================
// Close modal khi click ngoài
// ======================================
window.onclick = function (event) {
    const modal = document.getElementById('chartModal');
    if (event.target === modal) closeChart();
};
