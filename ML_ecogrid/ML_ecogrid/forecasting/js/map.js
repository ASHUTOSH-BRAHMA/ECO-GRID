// map.js — Leaflet India map with zone polygons

let leafletMap = null;
const zoneMarkers = {};
const zoneCircles = {};

const ZONE_COORDS = {
  Northern:     [28.6139, 77.2090],
  Southern:     [12.9716, 77.5946],
  Eastern:      [22.5726, 88.3639],
  Western:      [19.0760, 72.8777],
  NorthEastern: [26.1445, 91.7362],
};

const ZONE_COLORS = {
  surplus: '#00e5a0',
  deficit: '#ff4d6d',
};

function initMap() {
  leafletMap = L.map('map', {
    center: [22.5, 82.0],
    zoom: 4,
    zoomControl: false,
    attributionControl: false,
    dragging: true,
    scrollWheelZoom: false,
  });

  // Dark tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
  }).addTo(leafletMap);

  // Add zone markers
  Object.entries(ZONE_COORDS).forEach(([zone, coords]) => {
    const circle = L.circleMarker(coords, {
      radius: 10,
      fillColor: '#4d9fff',
      color: '#1a4a80',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.7,
    }).addTo(leafletMap);

    circle.bindTooltip(zone, {
      permanent: false,
      className: 'zone-tooltip',
      direction: 'top',
    });

    circle.on('click', () => {
      window.selectZone(zone);
    });

    zoneCircles[zone] = circle;
  });
}

function updateMapZones(zonesSummary) {
  zonesSummary.zones.forEach(z => {
    const circle = zoneCircles[z.zone];
    if (!circle) return;
    const color = z.status === 'surplus' ? ZONE_COLORS.surplus : ZONE_COLORS.deficit;
    circle.setStyle({
      fillColor: color,
      color: z.status === 'surplus' ? '#007a50' : '#aa1133',
    });
  });
}

function highlightZone(zone) {
  Object.entries(zoneCircles).forEach(([z, circle]) => {
    if (z === zone) {
      circle.setStyle({ radius: 14, weight: 3, opacity: 1 });
    } else {
      circle.setStyle({ radius: 10, weight: 2, opacity: 0.7 });
    }
  });

  const coords = ZONE_COORDS[zone];
  if (coords) leafletMap.setView(coords, 5, { animate: true });
}