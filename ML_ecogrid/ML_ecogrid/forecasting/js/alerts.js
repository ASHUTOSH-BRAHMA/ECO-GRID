// alerts.js — Alert cards and trade signal rendering

function renderAlerts(alerts) {
  const list  = document.getElementById('alerts-list');
  const badge = document.getElementById('alert-count');

  badge.textContent = alerts.length;

  if (alerts.length === 0) {
    list.innerHTML = `<div style="text-align:center;color:var(--text3);font-size:11px;padding:16px;">No alerts for this window</div>`;
    return;
  }

  list.innerHTML = alerts.map(a => `
    <div class="alert-item alert-${a.severity}">
      <div class="alert-type">${a.type === 'peak_demand' ? '⚡ Peak Demand' : '↑ Surplus'}</div>
      <div class="alert-msg">${a.message}</div>
      <div class="alert-time">${formatTime(a.time)}</div>
    </div>
  `).join('');
}

function renderTradeSignals(buy_windows, sell_windows) {
  const buyEl  = document.getElementById('buy-signals');
  const sellEl = document.getElementById('sell-signals');

  buyEl.innerHTML = buy_windows.slice(0,8).map(b => `
    <div class="signal-item signal-buy">
      <div>
        <div class="signal-label">Buy Window</div>
        <div class="signal-time">${formatTime(b.time)}</div>
      </div>
      <div class="signal-price">₹${b.price.toFixed(2)}</div>
    </div>
  `).join('') || `<div style="color:var(--text3);font-size:11px;padding:8px;">No buy windows detected</div>`;

  sellEl.innerHTML = sell_windows.slice(0,8).map(s => `
    <div class="signal-item signal-sell">
      <div>
        <div class="signal-label">Sell Window</div>
        <div class="signal-time">${formatTime(s.time)}</div>
      </div>
      <div class="signal-price">₹${s.price.toFixed(2)}</div>
    </div>
  `).join('') || `<div style="color:var(--text3);font-size:11px;padding:8px;">No sell windows detected</div>`;
}

function renderWeather(weather, zone) {
  document.getElementById('weather-zone-badge').textContent = zone;

  const items = [
    { label: 'Temperature', value: weather.temperature, unit: '°C' },
    { label: 'Wind Speed',  value: weather.windspeed,   unit: 'm/s' },
    { label: 'Irradiance',  value: weather.irradiance,  unit: 'W/m²' },
    { label: 'Cloud Cover', value: weather.cloudcover,  unit: '%' },
    { label: 'Humidity',    value: weather.humidity,    unit: '%' },
    { label: 'Rainfall',    value: weather.precipitation, unit: 'mm' },
  ];

  document.getElementById('weather-grid').innerHTML = items.map(i => `
    <div class="weather-item">
      <div class="weather-label">${i.label}</div>
      <div class="weather-value">${i.value}<span class="weather-unit"> ${i.unit}</span></div>
    </div>
  `).join('');
}

function renderVolatility(index) {
  const el    = document.getElementById('gauge-val');
  const fill  = document.getElementById('gauge-fill');
  const label = document.getElementById('gauge-label');

  el.textContent = index.toFixed(1);
  fill.style.width = Math.min(index, 100) + '%';

  if (index < 10) {
    el.style.color = 'var(--green)';
    label.textContent = 'Low Risk — Stable Market';
  } else if (index < 20) {
    el.style.color = 'var(--yellow)';
    label.textContent = 'Moderate Risk — Watch Closely';
  } else {
    el.style.color = 'var(--red)';
    label.textContent = 'High Risk — Volatile Market';
  }
}

function renderKPIs(data) {
  const fc     = data.forecast;
  const prices = fc.map(f => f.price_inr_kwh);
  const supply = fc.map(f => f.total_supply_gw);
  const demand = fc.map(f => f.demand_gw);
  const avg    = arr => arr.reduce((a,b)=>a+b,0)/arr.length;

  const mix    = data.renewable_mix;
  const renPct = +(mix.solar + mix.wind + mix.hydro).toFixed(1);

  setKPI('kpi-supply', avg(supply).toFixed(1), 'var(--green)');
  setKPI('kpi-demand', avg(demand).toFixed(1), 'var(--red)');
  setKPI('kpi-price',  avg(prices).toFixed(2), 'var(--yellow)');
  setKPI('kpi-vol',    data.volatility_index,   data.volatility_index > 20 ? 'var(--red)' : data.volatility_index > 10 ? 'var(--yellow)' : 'var(--green)');
  setKPI('kpi-carbon', data.carbon_intensity.toFixed(0), 'var(--blue)');
  setKPI('kpi-ren',    renPct, 'var(--green)');
}

function setKPI(id, val, color) {
  const el = document.getElementById(id);
  el.className = 'kpi-value';
  el.style.color = color;
  el.textContent = val;
}

function renderModelMetrics(metrics) {
  const names = { total_supply_gw: 'Supply', demand_gw: 'Demand', price_inr_kwh: 'Price' };
  document.getElementById('metrics-grid').innerHTML = Object.entries(metrics).map(([k,v]) => `
    <div class="metric-row">
      <div class="metric-name">${names[k] || k}</div>
      <div class="metric-vals">
        <div class="metric-val"><span class="metric-val-label">MAE</span><span class="metric-val-num">${v.MAE}</span></div>
        <div class="metric-val"><span class="metric-val-label">MAPE</span><span class="metric-val-num">${v.MAPE}%</span></div>
      </div>
    </div>
  `).join('');
}

function renderZoneComparison(zonesSummary, activeZone) {
  const sorted = [...zonesSummary.zones].sort((a,b) => a.price - b.price);
  const minPrice = sorted[0].price;

  document.getElementById('comparison-tbody').innerHTML = sorted.map(z => {
    const isActive  = z.zone === activeZone;
    const isArb     = z.price === minPrice && z.status === 'surplus';
    return `
      <tr style="${isActive ? 'background:rgba(0,229,160,0.04);' : ''}">
        <td style="color:${isActive?'var(--green)':'var(--text)'}">
          ${z.zone.slice(0,5)}
          ${isArb ? '<span class="arb-badge">ARB</span>' : ''}
        </td>
        <td style="color:var(--yellow)">₹${z.price.toFixed(2)}</td>
        <td style="color:var(--text2)">${z.demand_gw.toFixed(1)}</td>
        <td><span class="zone-status status-${z.status}">${z.status}</span></td>
      </tr>
    `;
  }).join('');
}

function renderCarbonBars(zonesSummary) {
  const maxC = Math.max(...zonesSummary.zones.map(z => z.carbon_intensity));
  document.getElementById('carbon-bars').innerHTML = zonesSummary.zones.map(z => {
    const pct = (z.carbon_intensity / maxC * 100).toFixed(1);
    const color = z.carbon_intensity < 400 ? 'var(--green)' : z.carbon_intensity < 600 ? 'var(--yellow)' : 'var(--red)';
    return `
      <div class="carbon-zone-row">
        <div class="carbon-zone-name">${z.zone.slice(0,9)}</div>
        <div class="carbon-bar-bg"><div class="carbon-bar-fill" style="width:${pct}%;background:${color}"></div></div>
        <div class="carbon-val" style="color:${color}">${z.carbon_intensity.toFixed(0)}</div>
      </div>
    `;
  }).join('');
}

function renderZoneSelector(zonesSummary, activeZone) {
  document.getElementById('zone-selector').innerHTML = zonesSummary.zones.map(z => `
    <div class="zone-item ${z.zone === activeZone ? 'active' : ''}" onclick="selectZone('${z.zone}')">
      <div style="display:flex;align-items:center;">
        <div class="zone-dot" style="background:${z.status==='surplus'?'var(--green)':'var(--red)'}"></div>
        <div class="zone-name">${z.zone}</div>
      </div>
      <div class="zone-meta">
        <div class="zone-price">₹${z.price.toFixed(2)}</div>
        <div class="zone-status status-${z.status}">${z.status}</div>
      </div>
    </div>
  `).join('');
}

function formatTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { month:'short', day:'numeric' }) + ' ' + d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:false });
}