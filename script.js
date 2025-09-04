const eraWidget = new EraWidget();
let configMap = {}; // lưu config của từng sensor
let sensorData = {}; // lưu giá trị realtime

eraWidget.onConfiguration((configuration) => {
    configuration.realtime_configs.forEach(cfg => {
        configMap[cfg.name] = cfg.id;
        sensorData[cfg.name] = 0; // giá trị mặc định
    });
});

eraWidget.onValues((values) => {
    for (let name in configMap) {
        const id = configMap[name];
        sensorData[name] = values[id].value;
    }
});

eraWidget.ready();

// Hiển thị modal chart khi nhấn vào ô
document.querySelectorAll('.dashboard-cell').forEach(cell => {
    cell.addEventListener('click', () => {
        const sensorName = cell.dataset.sensor;
        openChartModal(sensorName);
    });
});

// Đóng modal
document.getElementById('closeModal').onclick = () => {
    document.getElementById('chartModal').style.display = 'none';
};

// Hàm mở chart modal
function openChartModal(sensorName) {
    document.getElementById('chartTitle').innerText = sensorName;
    document.getElementById('chartModal').style.display = 'flex';

    const dataBuffer = []; // lưu dữ liệu realtime của sensor
    const chart = Highcharts.chart('chartContainer', {
        chart: { type: 'areaspline' },
        title: { text: `Realtime Data: ${sensorName}` },
        xAxis: { type: 'datetime' },
        yAxis: { title: { text: sensorName } },
        series: [{ name: sensorName, data: [] }]
    });

    // Realtime update
    const interval = setInterval(() => {
        const x = (new Date()).getTime();
        const y = sensorData[sensorName];
        chart.series[0].addPoint([x, y], true, false);
        dataBuffer.push([x, y]);
        // Giới hạn dữ liệu tối đa 30 phút
        const cutoff = x - 1800 * 1000;
        while (dataBuffer.length > 0 && dataBuffer[0][0] < cutoff) dataBuffer.shift();
    }, 1000);

    // Load history khi nhấn button
    document.getElementById('loadHistory').onclick = () => {
        const start = new Date(document.getElementById('startTime').value).getTime();
        const end = new Date(document.getElementById('endTime').value).getTime();
        const filtered = dataBuffer.filter(p => p[0] >= start && p[0] <= end);
        chart.series[0].setData(filtered, true);
    };

    // Khi đóng modal, dừng interval
    document.getElementById('closeModal').onclick = () => {
        clearInterval(interval);
        document.getElementById('chartModal').style.display = 'none';
    };
}
