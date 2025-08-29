let chart, chartTimer = null;
let currentSensorKey = null;
let chartLabel = '', chartUnit = '';
let mode = 'realtime'; // 'realtime' | 'history'

function openChart(label, unit, sensorKey) {
  chartLabel = label; chartUnit = unit; currentSensorKey = sensorKey;
  document.getElementById('chartTitle').innerText = `${label} (${unit})`;
  document.getElementById('chartModal').style.display = 'block';
  document.getElementById('historyPanel').classList.add('hidden');
  mode = 'realtime';
  initChart();
  startRealtime();
}

function closeChart() {
  stopRealtime();
  if (chart) chart.destroy();
  document.getElementById('chartModal').style.display = 'none';
}

function initChart() {
  const ctx = document.getElementById('realtimeChart').getContext('2d');
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [{ label: chartLabel, data: [], borderWidth: 2, tension: 0.2 }] },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: 'Thời gian' } },
        y: { title: { display: true, text: chartUnit } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

/* ---------- Realtime ---------- */
function startRealtime() {
  stopRealtime();
  mode = 'realtime';
  document.getElementById('btnRealtime').disabled = true;
  chartTimer = setInterval(() => {
    const now = new Date();
    const label = now.toLocaleTimeString();
    const v = simulateLiveValue(currentSensorKey); // TODO: thay bằng dữ liệu thật
    pushPoint(label, v, 60); // giữ tối đa 60 điểm
  }, 1000);
}
function stopRealtime() {
  if (chartTimer) { clearInterval(chartTimer); chartTimer = null; }
  document.getElementById('btnRealtime').disabled = false;
}
function pushPoint(label, value, maxPoints=120) {
  const ds = chart.data.datasets[0];
  chart.data.labels.push(label);
  ds.data.push(Number(value));
  if (ds.data.length > maxPoints) {
    ds.data.shift(); chart.data.labels.shift();
  }
  chart.update();
}

/* ---------- History ---------- */
function toggleHistoryPanel() {
  const p = document.getElementById('historyPanel');
  p.classList.toggle('hidden');
  if (!p.classList.contains('hidden')) {
    // đang mở panel lịch sử -> tạm dừng realtime
    stopRealtime();
    mode = 'history';
  }
}
function switchToRealtime() {
  document.getElementById('historyPanel').classList.add('hidden');
  initChart();
  startRealtime();
}
async function loadHistory() {
  const fromStr = document.getElementById('fromTime').value;
  const toStr   = document.getElementById('toTime').value;
  if (!fromStr || !toStr) { alert('Chọn đầy đủ thời gian Từ/Đến'); return; }

  const from = new Date(fromStr);
  const to   = new Date(toStr);
  if (to <= from) { alert('Thời gian Đến phải lớn hơn Từ'); return; }

  stopRealtime();
  mode = 'history';
  initChart();

  // Lấy dữ liệu lịch sử (demo sinh dữ liệu giả đều mỗi phút).
  // => Đổi hàm fetchHistory() để gọi API thật của bạn.
  const points = await fetchHistory(currentSensorKey, from, to);

  chart.data.labels = points.map(p => new Date(p.ts).toLocaleString());
  chart.data.datasets[0].data = points.map(p => p.value);
  chart.update();
}

/* ---- Chỗ này thay bằng API thật của bạn ----
   Ví dụ API GET: /api/history?sensor=oxy&from=ISO&to=ISO
   Trả về [{ts: "2025-08-29T09:00:00Z", value: 5.6}, ...]
*/
async function fetchHistory(sensorKey, from, to) {
  // --- DEMO: tạo dữ liệu giả mỗi phút ---
  const msStep = 60 * 1000; // 1 phút
  const out = [];
  for (let t = from.getTime(); t <= to.getTime(); t += msStep) {
    out.push({ ts: new Date(t).toISOString(), value: simulateHistoryValue(sensorKey, t) });
  }
  return out;

  /* --- Dùng API thật (ví dụ):
  const url = `/api/history?sensor=${encodeURIComponent(sensorKey)}&from=${from.toISOString()}&to=${to.toISOString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Fetch history failed');
  return await res.json();
  */
}

/* ---------- Demo tạo dữ liệu ---------- */
function simulateLiveValue(key) {
  const base = { oxy1: 30, oxy2: 0, oxy: 5.5, vac: 0, air4: 0, air7: 10 }[key] ?? 0;
  return (base + (Math.sin(Date.now()/2000)+Math.random()*0.3)).toFixed(2);
}
function simulateHistoryValue(key, ts) {
  const base = { oxy1: 30, oxy2: 0, oxy: 5.5, vac: 0, air4: 0, air7: 10 }[key] ?? 0;
  const x = Math.sin(ts/300000) * 0.8 + Math.cos(ts/700000) * 0.4; // biến thiên chậm
  const noise = (Math.random()-0.5)*0.2;
  return +(base + x + noise).toFixed(2);
}
