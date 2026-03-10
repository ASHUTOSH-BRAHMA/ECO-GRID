// main.js — Main controller

let activeZone  = 'Northern';
let activeHours = 72;
let zonesSummary = null;
let forecastCache = {};
let allZoneForecastData = {};

// ── Init ──────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  initMap();
  setupTabs();
  setupTimeFilter();

  // Hide loader after 2s
  setTimeout(() => {
    document.getElementById('global-loader').classList.add('hidden');
  }, 2000);

  await loadAll();

  // Auto refresh every 5 minutes
  setInterval(async () => {
    forecastCache = {};
    await loadAll();
  }, 5 * 60 * 1000);
});

// ── Load everything ───────────────────────────────────────────────────────────
async function loadAll() {
  try {
    zonesSummary = await fetchZonesSummary();
    updateMapZones(zonesSummary);
    renderZoneSelector(zonesSummary, activeZone);
    renderZoneComparison(zonesSummary, activeZone);
    renderCarbonBars(zonesSummary);

    await loadForecast(activeZone, activeHours);
    await loadAllZoneHeatmap();

    document.getElementById('update-time').textContent =
      new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:false });
  } catch (err) {
    console.error('Load error:', err);
  }
}

// ── Load forecast for active zone ─────────────────────────────────────────────
async function loadForecast(zone, hours) {
  const cacheKey = `${zone}_${hours}`;
  let data = forecastCache[cacheKey];

  if (!data) {
    data = await fetchForecast(zone, hours);
    forecastCache[cacheKey] = data;
  }

  // Charts
  renderSupplyDemand(data.forecast, hours);
  renderPrice(data.forecast, hours);
  renderGeneration(data.forecast, hours);
  renderHourly(data.hour_of_day);
  renderSeasonality(data.seasonality);
  renderDonut(data.renewable_mix);

  // Panels
  renderAlerts(data.alerts);
  renderTradeSignals(data.buy_windows, data.sell_windows);
  renderWeather(data.weather_now, zone);
  renderVolatility(data.volatility_index);
  renderKPIs(data);
  renderModelMetrics(data.model_metrics);

  // Header
  document.getElementById('active-zone-name').textContent = zone;
  highlightZone(zone);
}

// ── Load all zones for heatmap ─────────────────────────────────────────────────
async function loadAllZoneHeatmap() {
  const zones = ['Northern', 'Southern', 'Eastern', 'Western', 'NorthEastern'];

  await Promise.all(zones.map(async zone => {
    const cacheKey = `${zone}_24`;
    if (!forecastCache[cacheKey]) {
      forecastCache[cacheKey] = await fetchForecast(zone, 24);
    }
    allZoneForecastData[zone] = forecastCache[cacheKey].forecast;
  }));

  renderPriceHeatmap(allZoneForecastData);
}

// ── Zone selection ────────────────────────────────────────────────────────────
window.selectZone = async function(zone) {
  if (zone === activeZone) return;
  activeZone = zone;

  // Update zone selector highlight
  document.querySelectorAll('.zone-item').forEach(el => {
    el.classList.toggle('active', el.querySelector('.zone-name')?.textContent === zone);
  });

  renderZoneComparison(zonesSummary, activeZone);
  await loadForecast(zone, activeHours);
};

// ── Time filter ───────────────────────────────────────────────────────────────
function setupTimeFilter() {
  document.querySelectorAll('.tf-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeHours = parseInt(btn.dataset.hours);
      await loadForecast(activeZone, activeHours);
    });
  });
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      btn.closest('.card').querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      btn.closest('.card').querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(`tab-${tab}`).classList.add('active');
    });
  });
}