// charts.js — All chart instances and render functions

let chartSD = null, chartPrice = null, chartGen = null;
let chartHourly = null, chartSeason = null, chartDonut = null;

const APEX_DEFAULTS = {
  chart: { background: 'transparent', toolbar: { show: false }, animations: { enabled: true, speed: 600 } },
  grid:  { borderColor: '#1e2440', strokeDashArray: 3 },
  tooltip: { theme: 'dark', style: { fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' } },
  xaxis: { labels: { style: { colors: '#4a5568', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
  yaxis: { labels: { style: { colors: '#4a5568', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' } } },
};

// ── Supply vs Demand ──────────────────────────────────────────────────────────
function renderSupplyDemand(forecast, hours) {
  const data = forecast.slice(0, hours);
  const labels = data.map(d => d.timestamp.slice(11, 16));

  if (chartSD) { chartSD.destroy(); chartSD = null; }

  chartSD = new ApexCharts(document.getElementById('chart-supply-demand'), {
    ...APEX_DEFAULTS,
    chart: { ...APEX_DEFAULTS.chart, type: 'area', height: 200 },
    series: [
      { name: 'Supply (GW)',  data: data.map(d => +d.total_supply_gw.toFixed(2)) },
      { name: 'Demand (GW)', data: data.map(d => +d.demand_gw.toFixed(2)) },
    ],
    colors: ['#00e5a0', '#ff4d6d'],
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.25, opacityTo: 0.0, shadeIntensity: 1 }
    },
    stroke: { width: 2, curve: 'smooth' },
    xaxis: { ...APEX_DEFAULTS.xaxis, categories: labels, tickAmount: 8 },
    yaxis: { ...APEX_DEFAULTS.yaxis, title: { text: 'GW', style: { color: '#4a5568', fontFamily: 'JetBrains Mono' } } },
    legend: { labels: { colors: '#8892b0' }, fontFamily: 'JetBrains Mono', fontSize: '10px' },
    dataLabels: { enabled: false },
  });
  chartSD.render();
  document.getElementById('loading-sd').classList.add('hidden');
}

// ── Price Forecast ────────────────────────────────────────────────────────────
function renderPrice(forecast, hours) {
  const data   = forecast.slice(0, hours);
  const labels = data.map(d => d.timestamp.slice(11, 16));
  const prices = data.map(d => +d.price_inr_kwh.toFixed(3));
  const avg    = prices.reduce((a,b)=>a+b,0)/prices.length;

  if (chartPrice) { chartPrice.destroy(); chartPrice = null; }

  chartPrice = new ApexCharts(document.getElementById('chart-price'), {
    ...APEX_DEFAULTS,
    chart: { ...APEX_DEFAULTS.chart, type: 'line', height: 180 },
    series: [{ name: '₹/kWh', data: prices }],
    colors: ['#ffd166'],
    stroke: { width: 2, curve: 'smooth' },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.2, opacityTo: 0.0 } },
    annotations: {
      yaxis: [{
        y: avg,
        borderColor: '#4a5568',
        strokeDashArray: 4,
        label: { text: `Avg ₹${avg.toFixed(2)}`, style: { color: '#8892b0', background: '#111525', fontFamily: 'JetBrains Mono', fontSize: '10px' } }
      }]
    },
    xaxis: { ...APEX_DEFAULTS.xaxis, categories: labels, tickAmount: 8 },
    yaxis: { ...APEX_DEFAULTS.yaxis, title: { text: '₹/kWh', style: { color: '#4a5568', fontFamily: 'JetBrains Mono' } } },
    dataLabels: { enabled: false },
    legend: { show: false },
  });
  chartPrice.render();
  document.getElementById('loading-price').classList.add('hidden');
  document.getElementById('price-hours').textContent = hours;
}

// ── Generation Breakdown ──────────────────────────────────────────────────────
function renderGeneration(forecast, hours) {
  const data   = forecast.slice(0, hours);
  const labels = data.map(d => d.timestamp.slice(11, 16));

  if (chartGen) { chartGen.destroy(); chartGen = null; }

  chartGen = new ApexCharts(document.getElementById('chart-generation'), {
    ...APEX_DEFAULTS,
    chart: { ...APEX_DEFAULTS.chart, type: 'area', height: 200, stacked: true },
    series: [
      { name: 'Solar',   data: data.map(d => +d.solar_gw.toFixed(2)) },
      { name: 'Wind',    data: data.map(d => +d.wind_gw.toFixed(2)) },
      { name: 'Hydro',   data: data.map(d => +d.hydro_gw.toFixed(2)) },
      { name: 'Thermal', data: data.map(d => +d.thermal_gw.toFixed(2)) },
    ],
    colors: ['#ffd166', '#4d9fff', '#00e5a0', '#ff6b6b'],
    fill: { type: 'solid', opacity: 0.7 },
    stroke: { width: 1, curve: 'smooth' },
    xaxis: { ...APEX_DEFAULTS.xaxis, categories: labels, tickAmount: 8 },
    yaxis: { ...APEX_DEFAULTS.yaxis, title: { text: 'GW', style: { color: '#4a5568', fontFamily: 'JetBrains Mono' } } },
    legend: { labels: { colors: '#8892b0' }, fontFamily: 'JetBrains Mono', fontSize: '10px' },
    dataLabels: { enabled: false },
  });
  chartGen.render();
  document.getElementById('loading-gen').classList.add('hidden');
}

// ── Renewable Mix Donut ───────────────────────────────────────────────────────
function renderDonut(mix) {
  const labels = ['Solar', 'Wind', 'Hydro', 'Thermal'];
  const values = [mix.solar, mix.wind, mix.hydro, mix.thermal];
  const colors = ['#ffd166', '#4d9fff', '#00e5a0', '#ff6b6b'];

  if (chartDonut) { chartDonut.destroy(); chartDonut = null; }

  chartDonut = new ApexCharts(document.getElementById('chart-donut'), {
    chart: { type: 'donut', height: 130, width: 130, background: 'transparent', toolbar: { show: false }, animations: { speed: 600 } },
    series: values,
    labels,
    colors,
    dataLabels: { enabled: false },
    legend: { show: false },
    plotOptions: { pie: { donut: { size: '65%', labels: { show: false } } } },
    tooltip: { theme: 'dark', style: { fontFamily: 'JetBrains Mono', fontSize: '11px' } },
    stroke: { width: 2, colors: ['#0c0f1a'] },
  });
  chartDonut.render();

  // Legend
  const legend = document.getElementById('donut-legend');
  legend.innerHTML = labels.map((l,i) => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${colors[i]}"></div>
      <span class="legend-name">${l}</span>
      <span class="legend-pct" style="color:${colors[i]}">${values[i]}%</span>
    </div>
  `).join('');
}

// ── Hour of Day Pattern ───────────────────────────────────────────────────────
function renderHourly(data) {
  if (chartHourly) { chartHourly.destroy(); chartHourly = null; }

  chartHourly = new ApexCharts(document.getElementById('chart-hourly'), {
    ...APEX_DEFAULTS,
    chart: { ...APEX_DEFAULTS.chart, type: 'bar', height: 160 },
    series: [{ name: 'Load Factor', data: data.map(d => d.factor) }],
    colors: ['#4d9fff'],
    xaxis: { ...APEX_DEFAULTS.xaxis, categories: data.map(d => d.hour % 6 === 0 ? `${d.hour}h` : ''), },
    yaxis: { ...APEX_DEFAULTS.yaxis, min: 0.5, max: 1.3 },
    dataLabels: { enabled: false },
    plotOptions: { bar: { borderRadius: 2, columnWidth: '80%' } },
    fill: { type: 'gradient', gradient: { shade: 'dark', type: 'vertical', opacityFrom: 0.9, opacityTo: 0.4 } },
    legend: { show: false },
  });
  chartHourly.render();
}

// ── Seasonality ───────────────────────────────────────────────────────────────
function renderSeasonality(data) {
  if (chartSeason) { chartSeason.destroy(); chartSeason = null; }

  chartSeason = new ApexCharts(document.getElementById('chart-seasonality'), {
    ...APEX_DEFAULTS,
    chart: { ...APEX_DEFAULTS.chart, type: 'line', height: 160 },
    series: [{ name: 'Demand Factor', data: data.map(d => d.factor) }],
    colors: ['#00e5a0'],
    stroke: { width: 2, curve: 'smooth' },
    markers: { size: 4, colors: ['#00e5a0'], strokeColors: '#0c0f1a', strokeWidth: 2 },
    xaxis: { ...APEX_DEFAULTS.xaxis, categories: data.map(d => d.month) },
    yaxis: { ...APEX_DEFAULTS.yaxis, min: 0.7, max: 1.3 },
    dataLabels: { enabled: false },
    legend: { show: false },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.2, opacityTo: 0.0 } },
  });
  chartSeason.render();
}

// ── Price Heatmap (D3) ────────────────────────────────────────────────────────
function renderPriceHeatmap(allZoneData) {
  const container = document.getElementById('price-heatmap');
  container.innerHTML = '';

  const zones  = Object.keys(allZoneData);
  const hours  = Array.from({length:24}, (_,i) => i);

  const margin = { top: 20, right: 10, bottom: 30, left: 90 };
  const W      = container.offsetWidth || 600;
  const H      = zones.length * 28 + margin.top + margin.bottom;
  const w      = W - margin.left - margin.right;
  const h      = H - margin.top - margin.bottom;

  const svg = d3.select(container).append('svg')
    .attr('width', W).attr('height', H)
    .style('background', 'transparent');

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const cellW = w / 24;
  const cellH = h / zones.length;

  // Build flat data
  const data = [];
  zones.forEach(zone => {
    const fc = allZoneData[zone];
    hours.forEach(hr => {
      const match = fc.find(f => parseInt(f.timestamp.slice(11,13)) === hr);
      data.push({ zone, hour: hr, price: match ? match.price_inr_kwh : 4.0 });
    });
  });

  const allPrices = data.map(d => d.price);
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);

  const color = d3.scaleSequential()
    .domain([minP, maxP])
    .interpolator(d3.interpolateRgbBasis(['#0c1a2e', '#1a4a80', '#ffd166', '#ff4d6d']));

  // X axis
  g.append('g').attr('transform', `translate(0,${h})`).selectAll('text')
    .data(hours.filter(h => h % 4 === 0)).enter().append('text')
    .attr('x', h => h * cellW + cellW/2)
    .attr('y', 16)
    .attr('text-anchor', 'middle')
    .style('fill', '#4a5568').style('font-size', '10px').style('font-family', 'JetBrains Mono')
    .text(h => `${h}h`);

  // Y axis
  g.append('g').selectAll('text')
    .data(zones).enter().append('text')
    .attr('x', -8).attr('y', (z,i) => i * cellH + cellH/2 + 4)
    .attr('text-anchor', 'end')
    .style('fill', '#8892b0').style('font-size', '10px').style('font-family', 'JetBrains Mono')
    .text(d => d.slice(0,5));

  // Cells
  g.selectAll('rect').data(data).enter().append('rect')
    .attr('x', d => d.hour * cellW + 1)
    .attr('y', d => zones.indexOf(d.zone) * cellH + 1)
    .attr('width', cellW - 2).attr('height', cellH - 2)
    .attr('rx', 2)
    .style('fill', d => color(d.price))
    .append('title')
    .text(d => `${d.zone} ${d.hour}:00 — ₹${d.price.toFixed(2)}/kWh`);
}