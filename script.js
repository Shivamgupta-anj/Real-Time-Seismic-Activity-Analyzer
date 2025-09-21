class SeismicAnalyzer {
  constructor() {
    this.isMonitoring = true;
    this.data = [];
    this.maxDataPoints = 100;
    this.eventsToday = 0;
    this.alertsEnabled = true;
    this.currentMagnitude = 0;
    this.peakAmplitude = 0;
    this.dominantFrequency = 0;

    this.initChart();
    this.startMonitoring();
    this.updateTimestamp();
  }

  initChart() {
    const ctx = document.getElementById('seismicChart').getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Amplitude (μm/s)',
          data: [],
          borderColor: '#00ff41',
          backgroundColor: 'rgba(0, 255, 65, 0.08)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: 'white' } } },
        scales: {
          x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
          y: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } }
        },
        animation: { duration: 0 }
      }
    });
  }

  generateSeismicData() {
    const time = Date.now();
    const baseNoise = (Math.random() - 0.5) * 2;
    let amplitude = baseNoise;

    if (Math.random() < 0.02) {
      const eventMagnitude = Math.random() * 6 + 1;
      amplitude += Math.sin(time * 0.01) * eventMagnitude * 10;
      this.currentMagnitude = eventMagnitude;
      this.eventsToday++;
      if (eventMagnitude > 4.0) {
        this.addAlert(
          `Earthquake detected! Magnitude: ${eventMagnitude.toFixed(1)}`,
          eventMagnitude > 6.0 ? 'alert' : 'warning'
        );
      }
    } else {
      this.currentMagnitude = Math.abs(amplitude) / 10;
    }

    this.peakAmplitude = Math.max(this.peakAmplitude, Math.abs(amplitude));
    this.dominantFrequency = 0.5 + Math.random() * 3;

    return {
      time: new Date(time).toLocaleTimeString(),
      amplitude,
      magnitude: this.currentMagnitude
    };
  }

  startMonitoring() {
    this.monitoringInterval = setInterval(() => {
      if (!this.isMonitoring) return;
      const newData = this.generateSeismicData();
      this.data.push(newData);
      if (this.data.length > this.maxDataPoints) this.data.shift();
      this.updateChart();
      this.updateMetrics();
      this.analyzePattern();
    }, 100);

    this.timestampInterval = setInterval(() => this.updateTimestamp(), 1000);
  }

  updateChart() {
    const labels = this.data.map(d => d.time);
    const amplitudes = this.data.map(d => d.amplitude);
    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = amplitudes;
    this.chart.update('none');
  }

  updateMetrics() {
    document.getElementById('current-magnitude').textContent = this.currentMagnitude.toFixed(2);
    document.getElementById('peak-amplitude').textContent = this.peakAmplitude.toFixed(1) + ' μm/s';
    document.getElementById('frequency').textContent = this.dominantFrequency.toFixed(1) + ' Hz';
    document.getElementById('events-today').textContent = this.eventsToday;
  }

  analyzePattern() {
    if (this.data.length < 10) return;
    const recent = this.data.slice(-10);
    const avgAmplitude = recent.reduce((s, d) => s + Math.abs(d.amplitude), 0) / recent.length;

    if (avgAmplitude > 25) {
      this.addAlert('CRITICAL: Extremely high seismic activity - Potential major event', 'alert');
    } else if (avgAmplitude > 15) {
      this.addAlert('High seismic activity detected - Increased monitoring recommended', 'warning');
    }

    const amplitudes = recent.map(d => Math.abs(d.amplitude));
    const variance = this.calculateVariance(amplitudes);
    if (variance > 50) {
      this.addAlert('Irregular seismic patterns detected - Anomalous activity', 'info');
    }
  }

  calculateVariance(arr) {
    const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
    return arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
  }

  addAlert(message, type = 'info') {
    if (!this.alertsEnabled) return;
    const alertsContainer = document.getElementById('alerts-container');
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert ' + type;
    alertDiv.innerHTML = `<strong>${new Date().toLocaleTimeString()}</strong><br>${message}`;
    alertsContainer.insertBefore(alertDiv, alertsContainer.firstChild);
    while (alertsContainer.children.length > 5) {
      alertsContainer.removeChild(alertsContainer.lastChild);
    }
  }

  updateTimestamp() {
    document.getElementById('timestamp').textContent = new Date().toLocaleString();
  }

  toggleMonitoringState() {
    this.isMonitoring = !this.isMonitoring;
    const btn = document.getElementById('monitorBtn');
    if (this.isMonitoring) {
      btn.innerHTML = '🟢 Monitoring';
      btn.classList.add('active');
      this.addAlert('Monitoring resumed', 'info');
    } else {
      btn.innerHTML = '🔴 Stopped';
      btn.classList.remove('active');
      this.addAlert('Monitoring paused', 'warning');
    }
  }

  resetData() {
    this.data = [];
    this.eventsToday = 0;
    this.peakAmplitude = 0;
    this.currentMagnitude = 0;
    this.chart.data.labels = [];
    this.chart.data.datasets[0].data = [];
    this.chart.update();
    this.updateMetrics();
    this.addAlert('Data reset completed', 'info');
  }

  exportData() {
    if (!this.data.length) {
      this.addAlert('No data to export', 'warning');
      return;
    }
    const rows = [
      'Time,Amplitude,Magnitude',
      ...this.data.map(d => `${d.time},${d.amplitude},${d.magnitude}`)
    ];
    const csv = rows.join('\n');
    const encoded = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    const filename = `seismic_data_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.addAlert('Data exported successfully', 'info');
  }

  toggleAlerts() {
    this.alertsEnabled = !this.alertsEnabled;
    this.addAlert(this.alertsEnabled ? 'Alerts enabled' : 'Alerts disabled', 'info');
  }
}

// Global functions
let analyzer = null;
function toggleMonitoring() { if (analyzer) analyzer.toggleMonitoringState(); }
function resetData() { if (analyzer) analyzer.resetData(); }
function exportData() { if (analyzer) analyzer.exportData(); }
function toggleAlerts() { if (analyzer) analyzer.toggleAlerts(); }

window.addEventListener('load', () => {
  analyzer = new SeismicAnalyzer();
});
