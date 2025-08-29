const sensors = [
  { key: 'temp', name: 'Nhiệt độ', value: 28, unit: '°C' },
  { key: 'hum', name: 'Độ ẩm', value: 70, unit: '%' },
  { key: 'press', name: 'Áp suất', value: 1.01, unit: 'atm' },
  { key: 'light', name: 'Ánh sáng', value: 500, unit: 'lux' }
];

const dash = document.getElementById('dashboard');
sensors.forEach(s => {
  const card = document.createElement('div');
  card.className = 'sensor-card';
  card.innerHTML = `
    <h3>${s.name}</h3>
    <p><strong>${s.value}</strong> ${s.unit}</p>
  `;
  card.onclick = () => openModal(s.key);
  dash.appendChild(card);
});

let chart = null;
let currentSensorKey = null;
let chartTimer = null;
let mode = 'realtime';

function openModal(sensorKey) {
  currentSensorKey = sensorKey;
  document.getElementById('chartModal').classList.add('active');
  document.getElementById('historyPanel').classList.remove('active');
  initChart();
  startRealtime();
}

function closeModal() {
  stopRealtime();
  document.getElementById('chartModal').classList.remove('active');
}

function initChart() {
  const ctx = document.getElementById('sensorChart').getContext('2d');
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: currentSensorKey,
        data: [],
        borderWidth: 2,
        fill: false
      }]
    },
    options: {
      animation: false,
      scales: { x: { display: true }, y: { beginAtZero: false } }
    }
  });
}

function startRealtime() {
  stopRealtime();
  mode = 'realtime';
  console.log('Bắt đầu realtime cho', currentSensorKey);
  document.getElementById('btnRealtime').disabled = true;
  chartTimer = setInterval(() => {
    const now = new Date();
    const label = now.toLocaleTimeString();
    const v = simulateLiveValue(currentSensorKey);
    pushPoint(label, v, 60);
  }, 1000);
}

function stopRealtime() {
  clearInterval(chartTimer);
  document.getElementById('btnRealtime').disabled = false;
}

function pushPoint(label, value, maxPoints) {
  chart.data.labels.push(label);
  chart.data.datasets[0].data.push(value);
  if (chart.data.labels.length > maxPoints) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }
  chart.update();
}

function simulateLiveValue(key) {
  const base = { temp: 28, hum: 70, press: 1.01, light: 500 }[key] || 0;
  return base + (Math.random() * 2 - 1);
}

document.getElementById('btnRealtime').onclick = () => {
  document.getElementById('historyPanel').classList.remove('active');
  startRealtime();
};
document.getElementById('btnHistory').onclick = () => {
  stopRealtime();
  document.getElementById('historyPanel').classList.toggle('active');
};

function loadHistory() {
  const fromStr = document.getElementById('fromTime').value;
  const toStr = document.getElementById('toTime').value;
  console.log('Tải lịch sử', fromStr, toStr);
  if (!fromStr || !toStr) { alert('Chọn đầy đủ thời gian'); return; }
  const from = new Date(fromStr);
  const to = new Date(toStr);
  if (to <= from) { alert('Thời gian không hợp lệ'); return; }
  stopRealtime();
  mode = 'history';
  initChart();
  fetchHistory(currentSensorKey, from, to).then(points => {
    chart.data.labels = points.map(p => new Date(p.ts).toLocaleString());
    chart.data.datasets[0].data = points.map(p => p.value);
    chart.update();
  });
}

function fetchHistory(key, from, to) {
  return new Promise(resolve => {
    const points = [];
    const step = 60000; // 1 phút
    for (let t = from.getTime(); t <= to.getTime(); t += step) {
      points.push({ ts: t, value: simulateLiveValue(key) });
    }
    resolve(points);
  });
}
