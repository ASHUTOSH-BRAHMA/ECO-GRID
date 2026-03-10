// api.js — All API calls live here
// Currently uses mockData.js
// MERN dev: replace BASE_URL and set USE_MOCK = false

const USE_MOCK  = false;   // ← set false when real API is ready
const BASE_URL  = 'http://127.0.0.1:8000';

async function fetchForecast(zone, hours) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 600)); // simulate network delay
    return generateMockForecast(zone, hours);
  }
  const res = await fetch(`${BASE_URL}/forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zone_name: zone, forecast_hours: hours })
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function fetchZonesSummary() {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 300));
    return MOCK_ZONES_SUMMARY;
  }
  const res = await fetch(`${BASE_URL}/zones/summary`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}