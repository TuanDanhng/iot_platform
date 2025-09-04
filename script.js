let chart = null;
let chartUnit = '';

// buffer dữ liệu cho từng sensor
let sensorBuffer = {
  oxy1: [], oxy2: [], oxy: [],
  vac: [], air4: [], air7: []
};

// Hàm cập nhật realtime từ ERA
function updateValue(id, value) {
  // cập nhật số ở tile
  document.getElementById(id).innerText = value.toFixed(2);

  // lưu vào buffer
  if (!sensorBuffer[id]) sensorBuffer[id] = [];
  sensorBuffer[id].push(value);

  // giữ tối đa 20 điểm
  if (sensorBuffer[id].length > 20) sensorBuffer[id].shift();

  // nếu đang mở chart của sensor này thì update luôn
  if (chart && chart.config.data.datasets[0].label === id) {
    chart.data.labels.push('');
    chart.data.datasets[0].data.push(value);
    if (chart.data.labels.length > 20) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }
    chart.update();
  }
}

// Mở modal + vẽ chart
function openChart(id, title, unit) {
  document.getElementById("chartModal").style.display = "flex";
  document.getElementById("chartTitle").innerText = title;
  chartUnit = unit;

  const ctx = document.getElementById("myChart").getContext("2d");
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: sensorBuffer[id].map(() => ''),
      datasets: [{
        label: id,
        data: sensorBuffer[id],
        borderColor: 'blue',
        fill: false
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          title: {
            display: true,
            text: unit
          }
        }
      }
    }
  });
}

// Đóng modal
function closeChart() {
  document.getElementById("chartModal").style.display = "none";
}
